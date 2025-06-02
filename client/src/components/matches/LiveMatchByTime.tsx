import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { countryCodeMap } from "@/lib/flagUtils";

interface LiveMatchByTimeProps {
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const LiveMatchByTime: React.FC<LiveMatchByTimeProps> = ({
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
      console.warn(
        "Unknown country for flag mapping, trying SportsRadar fallback:",
        cleanCountry,
      );
      // Try SportsRadar flags API as fallback
      return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, "_")}/flag_24x24.png`;
    }
  };

  // Use only the live fixtures data
  const allFixtures = fixtures;

  // Collect all matches from all leagues and add league info
  const allMatches = allFixtures.map((fixture: any) => ({
    ...fixture,
    leagueInfo: {
      name: fixture.league?.name || "Unknown League",
      country: fixture.league?.country || "Unknown Country",
      logo: fixture.league?.logo || "/assets/fallback-logo.svg",
    },
  }));

  // Filter for live matches only when both filters are active
  const filteredMatches =
    liveFilterActive && timeFilterActive
      ? allMatches.filter((match: any) => {
          const status = match.fixture.status.short;
          return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            status,
          );
        })
      : allMatches;

  // Sort all matches by priority: Live → Upcoming → Finished
  const sortedMatches = filteredMatches.sort((a: any, b: any) => {
    const aStatus = a.fixture.status.short;
    const bStatus = b.fixture.status.short;
    const aDate = parseISO(a.fixture.date);
    const bDate = parseISO(b.fixture.date);

    // Ensure valid dates
    if (!isValid(aDate) || !isValid(bDate)) {
      return 0;
    }

    const aTime = aDate.getTime();
    const bTime = bDate.getTime();

    // Check if matches are live
    const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      aStatus,
    );
    const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      bStatus,
    );

    // Live matches first
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // If both live, sort by status priority
    if (aIsLive && bIsLive) {
      const statusOrder: { [key: string]: number } = {
        LIVE: 1,
        "1H": 2,
        "2H": 3,
        HT: 4,
        ET: 5,
        BT: 6,
        P: 7,
        INT: 8,
      };
      const aOrder = statusOrder[aStatus] || 99;
      const bOrder = statusOrder[bStatus] || 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }

    // Check if matches are finished
    const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
    const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

    // Upcoming matches before finished matches
    if (!aIsFinished && bIsFinished) return -1;
    if (aIsFinished && !bIsFinished) return 1;

    // Within same category, sort by time
    return aTime - bTime;
  });

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
      <h3 className="text-base font-semi-bold text-gray-800 mt-4 bg-white border border-gray-200 p-3 ">
        {liveFilterActive && timeFilterActive
          ? "Popular Football Live Score"
          : liveFilterActive && !timeFilterActive
            ? "Live Football Scores"
            : !liveFilterActive && timeFilterActive
              ? "All Matches by Time"
              : "Live Football Scores"}
      </h3>

      {/* Single consolidated card with all matches sorted by time */}
      <Card className=" overflow-hidden">
        {/* Header showing total matches */}

        {/* All Matches */}
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match: any) => (
              <div
                key={match.fixture.id}
                className="bg-white hover:bg-gray-200 transition-all duration-200 cursor-pointer border-b border-gray-200 last:border-b-0"
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
    </>
  );
};

export default LiveMatchByTime;
