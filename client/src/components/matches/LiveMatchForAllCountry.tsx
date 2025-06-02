import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { countryCodeMap } from "@/lib/flagUtils";

interface LiveMatchForAllCountryProps {
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const LiveMatchForAllCountry: React.FC<LiveMatchForAllCountryProps> = ({
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
}) => {
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Fetch all live fixtures with automatic refresh
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["live-fixtures-all-countries"],
    queryFn: async () => {
      console.log("Fetching live fixtures for all countries");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();

      console.log(`Received ${data.length} live fixtures`);
      return data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection time
    enabled: enableFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: refreshInterval, // Auto-refresh every 30 seconds
  });

  // Enhanced country flag mapping with better null safety
  const getCountryFlag = (
    country: string | null | undefined,
    leagueFlag?: string | null,
  ) => {
    // Use league flag if available and valid
    if (
      leagueFlag &&
      typeof leagueFlag === "string" &&
      leagueFlag.trim() !== ""
    ) {
      return leagueFlag;
    }

    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== "string" || country.trim() === "") {
      return "/assets/fallback-logo.png"; // Default football logo
    }

    const cleanCountry = country.trim();

    // Special handling for Unknown country only
    if (cleanCountry === "Unknown") {
      return "/assets/fallback-logo.png"; // Default football logo
    }

    // Special cases for international competitions
    if (cleanCountry === "World") {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K";
    }

    if (cleanCountry === "Europe") {
      return "https://flagsapi.com/EU/flat/24.png";
    }

    // Use centralized countryCodeMap from flagUtils

    // Use country mapping, fallback to SportsRadar for unknown countries
    let countryCode = "XX";
    if (countryCodeMap[cleanCountry]) {
      countryCode = countryCodeMap[cleanCountry];
      return `https://flagsapi.com/${countryCode}/flat/24.png`;
    } else {
      // Try SportsRadar flags API as fallback
      return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, "_")}/flag_24x24.png`;
    }
  };

  // Use only the live fixtures data
  const allFixtures = fixtures;

  // Group live fixtures by country and league with comprehensive null checks
  const fixturesByCountry = allFixtures.reduce((acc: any, fixture: any) => {
    // Validate fixture structure
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      return acc;
    }

    // Validate league data
    const league = fixture.league;
    if (!league.id || !league.name) {
      return acc;
    }

    // Validate team data
    if (
      !fixture.teams.home ||
      !fixture.teams.away ||
      !fixture.teams.home.name ||
      !fixture.teams.away.name
    ) {
      return acc;
    }

    const country = league.country;

    // Skip fixtures without a valid country, but keep World and Europe competitions
    if (
      !country ||
      country === null ||
      country === undefined ||
      typeof country !== "string" ||
      country.trim() === "" ||
      country.toLowerCase() === "unknown"
    ) {
      console.warn(
        "Skipping fixture with invalid/unknown country:",
        country,
        fixture,
      );
      return acc;
    }

    // Only allow valid country names, World, and Europe
    const validCountry = country.trim();
    if (
      validCountry !== "World" &&
      validCountry !== "Europe" &&
      validCountry.length === 0
    ) {
      console.warn(
        "Skipping fixture with empty country name:",
        country,
        fixture,
      );
      return acc;
    }

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

    // Add fixture with safe team data
    acc[country].leagues[leagueId].matches.push({
      ...fixture,
      teams: {
        home: {
          ...fixture.teams.home,
          logo: fixture.teams.home.logo || "/assets/fallback-logo.png",
        },
        away: {
          ...fixture.teams.away,
          logo: fixture.teams.away.logo || "/assets/fallback-logo.png",
        },
      },
    });

    return acc;
  }, {});

  // Sort countries: those with popular leagues first, then alphabetically
  const sortedCountries = Object.values(fixturesByCountry).sort(
    (a: any, b: any) => {
      // First sort by popular leagues
      if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
      if (!a.hasPopularLeague && b.hasPopularLeague) return 1;

      // Then alphabetically
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    },
  );

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
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

  if (!allFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No live matches available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Main Header */}
      <h3 className="text-base font-bold text-gray-800 mt-4 mb-0 bg-white border border-gray-200 p-3 rounded-lg">
        {liveFilterActive && timeFilterActive
          ? "Popular Football Live Score"
          : liveFilterActive && !timeFilterActive
            ? "Live Football Scores"
            : !liveFilterActive && timeFilterActive
              ? "All Matches by Time"
              : "Live Football Scores"}
      </h3>

      {/* Create individual league cards from all countries */}
      {sortedCountries.flatMap((countryData: any, countryIndex: number) =>
        Object.values(countryData.leagues)
          .sort((a: any, b: any) => {
            // First prioritize popular leagues (Champions League, Europa League, etc.)
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;

            // If both or neither are popular, prioritize by league importance
            const aLeagueName = a.league?.name?.toLowerCase() || "";
            const bLeagueName = b.league?.name?.toLowerCase() || "";

            // Top tier leagues get highest priority
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

            // Then alphabetically
            return a.league.name.localeCompare(b.league.name);
          })
          .map((leagueData: any, leagueIndex: number) => {
            // Calculate if this is the very first card across all countries
            const isFirstCard = countryIndex === 0 && leagueIndex === 0;

            return (
              <Card
                key={`${countryData.country}-${leagueData.league.id}`}
                className={`overflow-hidden ${isFirstCard ? "" : "mt-4"}`}
              >
                {/* League Header */}
                <div className="flex items-start gap-2 p-3 bg-white border-b border-gray-200">
                  <img
                    src={leagueData.league.logo || "/assets/fallback-logo.svg"}
                    alt={leagueData.league.name || "Unknown League"}
                    className="w-6 h-6 object-contain mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/fallback-logo.svg";
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-gray-800">
                      {leagueData.league.name || "Unknown League"}
                    </span>
                    <span className="text-xs text-gray-600">
                      {leagueData.league.country || "Unknown Country"}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-auto">
                    {leagueData.isPopular && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Popular
                      </span>
                    )}
                    <span className="relative flex h-3 w-3 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                </div>

                {/* Live Matches */}
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {leagueData.matches.map((match: any) => (
                      <div
                        key={match.fixture.id}
                        className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center px-3 py-2">
                          {/* Home Team */}
                          <div className="text-right text-sm text-gray-900 min-w-0 flex-1 pr-2 truncate">
                            {match.teams.home.name}
                          </div>

                          <div className="flex-shrink-0 mx-1">
                            <img
                              src={
                                match.teams.home.logo ||
                                "/assets/fallback-logo.png"
                              }
                              alt={match.teams.home.name}
                              className="w-9 h-9 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (
                                  target.src !== "/assets/fallback-logo.png"
                                ) {
                                  target.src = "/assets/fallback-logo.png";
                                }
                              }}
                            />
                          </div>

                          {/* Score/Time Center - Live matches */}
                          <div
                            className="flex flex-col items-center justify-center px-4 flex-shrink-0"
                            style={{ marginTop: "-14px" }}
                          >
                            <div className="text-xs font-semibold mb-0.5">
                              {match.fixture.status.short === "FT" ? (
                                <span className="text-gray-600">Ended</span>
                              ) : match.fixture.status.short === "HT" ? (
                                <span className="text-red-600 animate-pulse">
                                  HT
                                </span>
                              ) : (
                                <span className="text-red-600 animate-pulse">
                                  {match.fixture.status.elapsed || 0}'
                                </span>
                              )}
                            </div>
                            <div className="text-lg font-bold flex items-center gap-2">
                              <span className="text-black">2</span>
                              <span className="text-gray-400">-</span>
                              <span className="text-black">2</span>
                            </div>
                          </div>

                          <div className="flex-shrink-0 mx-1">
                            <img
                              src={
                                match.teams.away.logo ||
                                "/assets/fallback-logo.png"
                              }
                              alt={match.teams.away.name}
                              className="w-9 h-9 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (
                                  target.src !== "/assets/fallback-logo.png"
                                ) {
                                  target.src = "/assets/fallback-logo.png";
                                }
                              }}
                            />
                          </div>

                          {/* Away Team */}
                          <div className="text-left text-sm text-gray-900 min-w-0 flex-1 pl-2 truncate">
                            {match.teams.away.name}
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
    </>
  );
};

export default LiveMatchForAllCountry;
