import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NoLiveMatchesEmpty from "@/components/matches/NoLiveMatchesEmpty";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { countryCodeMap } from "@/lib/flagUtils";
import { getTeamLogoSources, isNationalTeam, createTeamLogoErrorHandler } from "@/lib/teamLogoSources";
import { MySmartDateLabeling } from "@/lib/MySmartDateLabeling";

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

  // Enhanced team logo source with 365scores integration
  const getTeamLogoUrl = (team: any, league?: any) => {
    const isNational = isNationalTeam(team, league);
    const sources = getTeamLogoSources(team, isNational);
    
    // Return the highest priority source
    return sources[0]?.url || "/assets/fallback-logo.svg";
  };

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
      return "/assets/fallback-logo.svg"; // Default football logo
    }

    const cleanCountry = country.trim();

    // Special handling for Unknown country only
    if (cleanCountry === "Unknown") {
      return "/assets/fallback-logo.svg"; // Default football logo
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

    // Add fixture with enhanced team logo data
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
      // First sort by popular leagues
      if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
      if (!a.hasPopularLeague && b.hasPopularLeague) return 1;

      // Then alphabetically
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    },
  );

  // Process live matches with smart date labeling context
  const processedCountries = sortedCountries.map((countryData: any) => ({
    ...countryData,
    leagues: Object.fromEntries(
      Object.entries(countryData.leagues).map(([leagueId, leagueData]: [string, any]) => [
        leagueId,
        {
          ...leagueData,
          matches: leagueData.matches.map((match: any) => {
            const smartResult = MySmartDateLabeling.getSmartDateLabel(
              match.fixture.date,
              match.fixture.status.short
            );
            return {
              ...match,
              smartDateLabel: smartResult.label,
              smartDateReason: smartResult.reason
            };
          })
        }
      ])
    )
  }));

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
      <NoLiveMatchesEmpty 
        showBackButton={false}
        title="No Live Matches"
        description="There are no matches currently in play. Our system is continuously monitoring for live matches."
      />
    );
  }

  return (
    <>
      {/* Main Header */}
      <h3 className="text-base font-semibbold text-gray-800 mt-4 mb-0 bg-white border border-gray-200 p-3 ">
        {liveFilterActive && timeFilterActive
          ? "Popular Football Live Score"
          : liveFilterActive && !timeFilterActive
            ? "Popular Football Live Score"
            : !liveFilterActive && timeFilterActive
              ? "All Matches by Time"
              : "Popular Football Live Score"}
      </h3>
      {/* Create individual league cards from all countries */}
      {processedCountries.flatMap((countryData: any, countryIndex: number) =>
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
                    <span className="relative flex h-3 w-3 mt-1"></span>
                  </div>
                </div>
                {/* Live Matches */}
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {leagueData.matches
                      .sort((a: any, b: any) => {
                        // Sort live matches by elapsed time ascending (shorter elapsed time first)
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

                        // If both are live, sort by elapsed time ascending
                        if (aIsLive && bIsLive) {
                          const aElapsed =
                            Number(a.fixture.status.elapsed) || 0;
                          const bElapsed =
                            Number(b.fixture.status.elapsed) || 0;
                          return aElapsed - bElapsed; // Ascending order: shorter elapsed time first
                        }

                        // Live matches first
                        if (aIsLive && !bIsLive) return -1;
                        if (!aIsLive && bIsLive) return 1;

                        // If neither is live, maintain original order
                        return 0;
                      })
                      .map((match: any) => (
                        <div
                          key={match.fixture.id}
                          className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center px-3 py-2 mt-[0px] mb-[0px] pt-[16px] pb-[16px]">
                            {/* Home Team - Fixed width to prevent overflow */}
                            <div className="text-right text-sm text-gray-900 w-[100px] pr-2 truncate flex-shrink-0">
                              {match.teams.home.name}
                            </div>

                            <div className="flex-shrink-0 mx-1">
                              <img
                                src={match.teams.home.logo}
                                alt={`${match.teams.home.name} logo`}
                                title={match.teams.home.name}
                                className={`w-9 h-9 rounded-full ${
                                  isNationalTeam(match.teams.home, leagueData.league)
                                    ? "object-cover"
                                    : "object-contain"
                                }`}
                                loading="lazy"
                                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
                                onError={createTeamLogoErrorHandler(match.teams.home, isNationalTeam(match.teams.home, leagueData.league))}
                              />
                            </div>

                            {/* Score/Time Center - Fixed width to maintain position */}
                            <div
                              className="flex flex-col items-center justify-center px-4 w-[80px] flex-shrink-0"
                              style={{ marginTop: "-14px" }}
                            >
                              <div className="text-xs font-semibold mb-0.5">
                                {match.fixture.status.short === "FT" ? (
                                  <span className="text-gray-600">Ended</span>
                                ) : match.fixture.status.short === "HT" ? (
                                  <span className="text-red-600 animate-pulse">
                                    Halftime
                                  </span>
                                ) : (
                                  <span className="text-red-600 animate-pulse">
                                    {match.fixture.status.elapsed || 0}'
                                  </span>
                                )}
                              </div>
                              <div className="text-lg font-bold flex items-center gap-2">
                                <span className="text-black">
                                  {match.goals?.home ?? 0}
                                </span>
                                <span className="text-gray-400">-</span>
                                <span className="text-black">
                                  {match.goals?.away ?? 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0 mx-1">
                              <img
                                src={match.teams.away.logo}
                                alt={`${match.teams.away.name} logo`}
                                title={match.teams.away.name}
                                className={`w-9 h-9 rounded-full ${
                                  isNationalTeam(match.teams.away, leagueData.league)
                                    ? "object-cover"
                                    : "object-contain"
                                }`}
                                loading="lazy"
                                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
                                onError={createTeamLogoErrorHandler(match.teams.away, isNationalTeam(match.teams.away, leagueData.league))}
                              />
                            </div>

                            {/* Away Team - Fixed width for consistency */}
                            <div className="text-left text-sm text-gray-900 w-[100px] pl-2 truncate flex-shrink-0">
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
