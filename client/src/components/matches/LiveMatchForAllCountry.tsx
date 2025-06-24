import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Activity, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { useCachedQuery, CacheManager } from "@/lib/cachingHelper";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { POPULAR_LEAGUES } from "@/lib/constants";
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
} from "@/lib/matchFilters";
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
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import "../../styles/flasheffect.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { NoLiveMatchesEmpty } from "./NoLiveMatchesEmpty";

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

interface LiveMatchForAllCountryProps {
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  liveFixtures?: any[]; // Accept shared live fixtures
  setLiveFilterActive?: (active: boolean) => void;
  onMatchCardClick?: (match: any) => void;
}

const LiveMatchForAllCountry: React.FC<LiveMatchForAllCountryProps> = ({
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
  liveFixtures: propsFixtures,
  setLiveFilterActive,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

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

  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  }, []);

  // Smart API fetching based on match status
  const getApiEndpoint = (matchStatus: string) => {
    const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];
    const recentlyFinishedStatuses = ['FT', 'AET', 'PEN'];
    const upcomingStatuses = ['NS', 'TBD'];

    if (liveStatuses.includes(matchStatus)) {
      return '/api/fixtures/live';
    } else if (recentlyFinishedStatuses.includes(matchStatus)) {
      return '/api/fixtures/live'; // Recently finished matches still in live endpoint
    } else if (upcomingStatuses.includes(matchStatus)) {
      // For upcoming matches, use specific league endpoints
      return '/api/leagues/38/fixtures'; // Premier League
    } else {
      // Default to live endpoint
      return '/api/fixtures/live';
    }
  };

  // Fetch live fixtures with smart endpoint selection
  const { data: liveFixtures = [], isLoading: isLiveLoading } = useQuery({
    queryKey: ["live-fixtures-all-countries"],
    queryFn: async () => {
      console.log("Fetching live fixtures for all countries");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      console.log(`Received ${data.length} live fixtures`);
      return data;
    },
    staleTime: 20000,
    gcTime: 2 * 60 * 1000,
    enabled: enableFetching && !propsFixtures,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: refreshInterval,
  });

  // Fetch Premier League fixtures for ended/upcoming matches
  const { data: premierLeagueFixtures = [], isLoading: isPremierLoading } = useQuery({
    queryKey: ["premier-league-fixtures"],
    queryFn: async () => {
      console.log("Fetching Premier League fixtures");
      const response = await apiRequest("GET", "/api/leagues/38/fixtures");
      const data = await response.json();
      console.log(`Received ${data.length} Premier League fixtures`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: enableFetching,
  });

  // Fetch La Liga fixtures for ended/upcoming matches
  const { data: laLigaFixtures = [], isLoading: isLaLigaLoading } = useQuery({
    queryKey: ["la-liga-fixtures"],
    queryFn: async () => {
      console.log("Fetching La Liga fixtures");
      const response = await apiRequest("GET", "/api/leagues/140/fixtures");
      const data = await response.json();
      console.log(`Received ${data.length} La Liga fixtures`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: enableFetching,
  });

  // Combine fixtures based on match status
  const combinedFixtures = useMemo(() => {
    if (propsFixtures) return propsFixtures;

    const allFixtures: any[] = [];
    const now = new Date();

    // Add live fixtures (priority)
    liveFixtures.forEach((fixture: any) => {
      const status = fixture.fixture?.status?.short;
      if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        allFixtures.push({ ...fixture, source: 'live' });
      }
    });

    // Add recently finished matches from live endpoint
    liveFixtures.forEach((fixture: any) => {
      const status = fixture.fixture?.status?.short;
      const fixtureDate = new Date(fixture.fixture?.date);
      const hoursAgo = differenceInHours(now, fixtureDate);

      if (['FT', 'AET', 'PEN'].includes(status) && hoursAgo <= 2) {
        allFixtures.push({ ...fixture, source: 'recently_finished' });
      }
    });

    // Add upcoming matches from league endpoints
    const upcomingFromPremier = premierLeagueFixtures.filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;
      const fixtureDate = new Date(fixture.fixture?.date);
      const hoursFromNow = differenceInHours(fixtureDate, now);

      return ['NS', 'TBD'].includes(status) && hoursFromNow <= 24 && hoursFromNow >= 0;
    });

    const upcomingFromLaLiga = laLigaFixtures.filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;
      const fixtureDate = new Date(fixture.fixture?.date);
      const hoursFromNow = differenceInHours(fixtureDate, now);

      return ['NS', 'TBD'].includes(status) && hoursFromNow <= 24 && hoursFromNow >= 0;
    });

    allFixtures.push(...upcomingFromPremier.map((f: any) => ({ ...f, source: 'upcoming_premier' })));
    allFixtures.push(...upcomingFromLaLiga.map((f: any) => ({ ...f, source: 'upcoming_laliga' })));

    // Remove duplicates based on fixture ID
    const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture?.id === fixture.fixture?.id)
    );

    console.log(`Combined ${uniqueFixtures.length} fixtures from various sources`);
    return uniqueFixtures;
  }, [liveFixtures, premierLeagueFixtures, laLigaFixtures, propsFixtures]);

  const isLoading = isLiveLoading || isPremierLoading || isLaLigaLoading;

  // Use combined fixtures
  const fixtures = combinedFixtures;

  // Effect to detect halftime and fulltime status changes
  useEffect(() => {
    if (!fixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();

    fixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);

      currentStatuses.set(matchId, currentStatus);

      // Only check for changes if we have a previous status (not on first load)
      if (previousStatus && previousStatus !== currentStatus) {
        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`);
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`);
          newFulltimeMatches.add(matchId);
        }
      }
    });

    // Update previous statuses AFTER checking for changes
    setPreviousMatchStatuses(currentStatuses);

    // Trigger flash for new halftime matches
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);
      setTimeout(() => setHalftimeFlashMatches(new Set()), 3000);
    }

    // Trigger flash for new fulltime matches
    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);
      setTimeout(() => setFulltimeFlashMatches(new Set()), 3000);
    }
  }, [fixtures]);

  // Enhanced team logo source with 365scores integration
  const getTeamLogoUrl = (team: any, league?: any) => {
    const isNational = isNationalTeam(team, league);
    const sources = getTeamLogoSources(team, isNational);
    return sources[0]?.url || "/assets/fallback-logo.svg";
  };

  // Enhanced country flag mapping with better null safety
  const getCountryFlag = (
    country: string | null | undefined,
    leagueFlag?: string | null,
  ) => {
    if (
      leagueFlag &&
      typeof leagueFlag === "string" &&
      leagueFlag.trim() !== ""
    ) {
      return leagueFlag;
    }

    if (!country || typeof country !== "string" || country.trim() === "") {
      return "/assets/fallback-logo.svg";
    }

    const cleanCountry = country.trim();

    if (cleanCountry === "Unknown") {
      return "/assets/fallback-logo.svg";
    }

    if (cleanCountry === "World") {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K";
    }

    if (cleanCountry === "Europe") {
      return "https://flagsapi.com/EU/flat/24.png";
    }

    const countryCodeMap = getCountryCode(cleanCountry);
    if (countryCodeMap) {
      return `https://flagsapi.com/${countryCodeMap}/flat/24.png`;
    } else {
      return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, "_")}/flag_24x24.png`;
    }
  };

  // Filter fixtures that are actually live or recently finished
  const [filteredFixtures, setFilteredFixtures] = useState<any[]>([]);
  const [hasLiveMatches, setHasLiveMatches] = useState(false);

  useEffect(() => {
    if (!fixtures || fixtures.length === 0) {
      setFilteredFixtures([]);
      setHasLiveMatches(false);
      return;
    }

    const now = new Date();
    const actualLiveFixtures = fixtures.filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;
      const fixtureDate = new Date(fixture.fixture?.date);
      const hoursAgo = differenceInHours(now, fixtureDate);
      const hoursFromNow = differenceInHours(fixtureDate, now);

      // Live matches
      const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

      // Recently finished (within 2 hours)
      const isRecentlyFinished = ["FT", "AET", "PEN"].includes(status) && hoursAgo <= 2;

      // Upcoming matches (within next 24 hours)
      const isUpcoming = ["NS", "TBD"].includes(status) && hoursFromNow <= 24 && hoursFromNow >= 0;

      return isLive || isRecentlyFinished || isUpcoming;
    });

    setFilteredFixtures(actualLiveFixtures);
    setHasLiveMatches(actualLiveFixtures.length > 0);
  }, [fixtures]);

  // Group fixtures by country
  const fixturesByCountry = filteredFixtures.reduce((acc: any, fixture: any) => {
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      return acc;
    }

    const league = fixture.league;
    if (!league.id || !league.name) {
      return acc;
    }

    if (
      !fixture.teams.home ||
      !fixture.teams.away ||
      !fixture.teams.home.name ||
      !fixture.teams.away.name
    ) {
      return acc;
    }

    // Apply exclusion filtering
    if (
      shouldExcludeFromPopularLeagues(
        league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        league.country,
      )
    ) {
      return acc;
    }

    const country = league.country || "World";
    const leagueId = league.id;

    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, league.flag),
        leagues: {},
        hasPopularLeague: POPULAR_LEAGUES.includes(leagueId),
      };
    }

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: {
          ...league,
          logo:
            league.logo || "https://media.api-sports.io/football/leagues/1.png",
        },
        matches: [],
        isPopular: POPULAR_LEAGUES.includes(leagueId),
      };
    }

    acc[country].leagues[leagueId].matches.push({
      ...fixture,
      teams: {
        home: {
          ...fixture.teams.home,
          logo: getTeamLogoUrl(fixture.teams.home, league),
        },
        away: {
          ...fixture.teams.away,
          logo: getTeamLogoUrl(fixture.teams.away, league),
        },
      },
    });

    return acc;
  }, {});

  // Sort countries: those with popular leagues first, then alphabetically
  const sortedCountries = Object.values(fixturesByCountry).sort(
    (a: any, b: any) => {
      if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
      if (!a.hasPopularLeague && b.hasPopularLeague) return 1;
      return (a.country || "").localeCompare(b.country || "");
    },
  );

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card className="mt-4">
        <CardHeader className="flex items-start gap-2 p-3 bg-white border border-stone-200 font-semibold">
          <span>Popular Football Live Score</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
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

  // Check if there are any live matches specifically
  const actuallyHasLiveMatches = filteredFixtures.some((fixture: any) => 
    ['LIVE', 'LIV', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture?.status?.short)
  );

  // Show no live matches when data has been loaded but no live matches found
  if (!isLoading && (!fixtures?.length || !actuallyHasLiveMatches)) {
    return (
      <Card className="mt-4">
        <CardHeader className="flex items-start gap-2 p-3 bg-white border border-stone-200 font-semibold">
          <span>Popular Football Live Score</span>
        </CardHeader>
        <CardContent className="p-0">
          <NoLiveMatchesEmpty 
            showBackButton={true}
            onBackToHome={() => {
              window.location.href = '/';
            }}
            setLiveFilterActive={setLiveFilterActive}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      {/* Header Section */}
      <Card>
        <CardHeader className="flex items-start gap-2 p-3 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between items-center w-full">
            <span>Popular Football Live Score</span>
          </div>
        </CardHeader>
      </Card>

      {/* Create individual league cards from all countries */}
      {sortedCountries.flatMap((countryData: any, countryIndex: number) =>
        Object.values(countryData.leagues)
          .sort((a: any, b: any) => {
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;

            const aLeagueName = a.league?.name?.toLowerCase() || "";
            const bLeagueName = b.league?.name?.toLowerCase() || "";

            const topTierLeagues = [
              "uefa champions league",
              "uefa europa league",
              "premier league",
              "la liga",
              "serie a",
              "bundesliga",
              "ligue 1",
            ];

            const aIsTopTier = topTierLeagues.some((league) =>
              aLeagueName.includes(league),
            );
            const bIsTopTier = topTierLeagues.some((league) =>
              bLeagueName.includes(league),
            );

            if (aIsTopTier && !bIsTopTier) return -1;
            if (!aIsTopTier && bIsTopTier) return 1;

            return a.league.name.localeCompare(b.league.name);
          })
          .map((leagueData: any, leagueIndex: number) => {
            const isFirstCard = countryIndex === 0 && leagueIndex === 0;

            return (
              <Card
                key={`${countryData.country}-${leagueData.league.id}`}
                className={`overflow-hidden ${isFirstCard ? "" : "mt-4"}`}
              >
                {/* League Header */}
                <CardContent className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
                  <img
                    src={leagueData.league.logo || "/assets/fallback-logo.svg"}
                    alt={leagueData.league.name || "Unknown League"}
                    className="w-6 h-6 object-contain rounded-full"
                    style={{ backgroundColor: "transparent" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/fallback-logo.svg";
                    }}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-gray-800" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                      {safeSubstring(leagueData.league.name, 0) ||
                        "Unknown League"}
                    </span>
                    <span className="text-gray-600" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                      {leagueData.league.country || "Unknown Country"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {leagueData.isPopular && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '11.3px' }}>
                        Popular
                      </span>
                    )}
                  </div>
                </CardContent>

                {/* Matches */}
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {leagueData.matches
                      .sort((a: any, b: any) => {
                        const aStatus = a.fixture.status.short;
                        const bStatus = b.fixture.status.short;

                        const aIsLive = [
                          "LIVE",
                          "1H",
                          "HT",
                          "2H",
                          "ET",
                          "BT",
                          "P",
                          "INT",
                        ].includes(aStatus);
                        const bIsLive = [
                          "LIVE",
                          "1H",
                          "HT",
                          "2H",
                          "ET",
                          "BT",
                          "P",
                          "INT",
                        ].includes(bStatus);

                        if (aIsLive && bIsLive) {
                          const aElapsed = Number(a.fixture.status.elapsed) || 0;
                          const bElapsed = Number(b.fixture.status.elapsed) || 0;
                          return aElapsed - bElapsed;
                        }

                        if (aIsLive && !bIsLive) return -1;
                        if (!aIsLive && bIsLive) return 1;

                        return 0;
                      })
                      .map((match: any) => (
                        <div
                          key={match.fixture.id}
                          className="country-matches-container"
                        >
                          <div 
                            className={`match-card-container group ${
                              halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
                            } ${
                              fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
                            }`}
                            onClick={() => onMatchCardClick?.(match)}
                            style={{ cursor: onMatchCardClick ? 'pointer' : 'default' }}
                          >
                            {/* Star Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStarMatch(match.fixture.id);
                              }}
                              className="match-star-button"
                              title="Add to favorites"
                            >
                              <Star
                                className={`match-star-icon ${
                                  starredMatches.has(match.fixture.id) ? "starred" : ""
                                }`}
                              />
                            </button>

                            <div className="match-three-grid-container">
                              {/* Status */}
                              <div className="match-status-top">
                                {(() => {
                                  const status = match.fixture.status.short;

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
                                          : `${match.fixture.status.elapsed || 0}'`}
                                      </div>
                                    );
                                  }

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
                                        {status === "FT" ? "Ended" : status}
                                      </div>
                                    );
                                  }

                                  if (status === "TBD") {
                                    return (
                                      <div className="match-status-label status-upcoming">
                                        Time TBD
                                      </div>
                                    );
                                  }

                                  return null;
                                })()}
                              </div>

                              {/* Main content */}
                              <div className="match-content-container">
                                {/* Home Team */}
                                <div
                                  className={`home-team-name ${
                                    match.goals.home !== null &&
                                    match.goals.away !== null &&
                                    match.goals.home > match.goals.away
                                      ? "winner"
                                      : ""
                                  }`}
                                >
                                  {match.teams.home.name || "Unknown Team"}
                                </div>

                                {/* Home team logo */}
                                <div className="home-team-logo-container">
                                  <LazyImage
                                    src={
                                      match.teams.home.id
                                        ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={match.teams.home.name}
                                    title={match.teams.home.name}
                                    className="team-logo"
                                    style={{ backgroundColor: "transparent" }}
                                    fallbackSrc="/assets/fallback-logo.svg"
                                  />
                                </div>

                                {/* Score/Time */}
                                <div className="match-score-container">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = parseISO(match.fixture.date);

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
                                  <LazyImage
                                    src={
                                      match.teams.away.id
                                        ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={match.teams.away.name}
                                    title={match.teams.away.name}
                                    className="team-logo"
                                    style={{ backgroundColor: "transparent" }}
                                    fallbackSrc="/assets/fallback-logo.svg"
                                  />
                                </div>

                                {/* Away Team */}
                                <div
                                  className={`away-team-name ${
                                    match.goals.home !== null &&
                                    match.goals.away !== null &&
                                    match.goals.away > match.goals.home
                                      ? "winner"
                                      : ""
                                  }`}
                                >
                                  {match.teams.away.name || "Unknown Team"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          }),
      )}
    </div>
  );
};

export default LiveMatchForAllCountry;