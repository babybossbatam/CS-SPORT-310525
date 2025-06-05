import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { countryCodeMap } from "@/lib/flagUtils";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import "../../styles/MyLogoPositioning.css";

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
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

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

  // Collect all matches from all leagues and add league info with smart date labeling
  const allMatches = allFixtures.map((fixture: any) => {
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    
    const smartResult = MySmartTimeFilter.getSmartTimeLabel(
      fixture.fixture.date,
      fixture.fixture.status.short,
      todayString + 'T12:00:00Z' // Use today as context for live matches
    );

    return {
      ...fixture,
      leagueInfo: {
        name: fixture.league?.name || "Unknown League",
        country: fixture.league?.country || "Unknown Country",
        logo: fixture.league?.logo || "/assets/fallback-logo.svg",
      },
      smartDateLabel: smartResult.label,
      smartDateReason: smartResult.reason,
      isActualDate: smartResult.isWithinTimeRange
    };
  });

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

  // Sort all matches by time with most recent first
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
    const now = new Date().getTime();

    // Check if matches are live
    const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      aStatus,
    );
    const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      bStatus,
    );

    // Check if matches are finished
    const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
    const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

    // Calculate time distance from now for prioritization
    const aTimeDistance = Math.abs(aTime - now);
    const bTimeDistance = Math.abs(bTime - now);

    // Live matches first (sorted by elapsed time descending - longest running first)
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    if (aIsLive && bIsLive) {
      const aElapsed = Number(a.fixture.status.elapsed) || 0;
      const bElapsed = Number(b.fixture.status.elapsed) || 0;

      // Ensure consistent ascending order: shorter elapsed time first
      const sortResult = aElapsed - bElapsed;
      return sortResult;
    }

    // Recently finished matches next (most recent first)
    if (aIsFinished && !bIsFinished) return -1;
    if (!aIsFinished && bIsFinished) return 1;
    if (aIsFinished && bIsFinished) {
      return bTime - aTime; // Most recent finished matches first
    }

    // Upcoming matches last (closest to start time first)
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
      <h3 className="font-semibold text-gray-800 mt-4 bg-white border border-gray-200 p-2" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
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
            {sortedMatches.map((match: any, index: number) => (
              <div
                key={`${match.fixture.id}-${match.fixture.status.elapsed}-${index}`}
                className="match-card-container group"
              >
                {/* Star Button with slide-in effect */}
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
                      starredMatches.has(match.fixture.id) ? "starred" : ""
                    }`}
                  />
                </button>

                <div className="match-content-container">
                  {/* Home Team - Fixed width to prevent overflow */}
                  <div className={`home-team-name ${
                    match.goals.home !== null && match.goals.away !== null && 
                    match.goals.home > match.goals.away ? 'winner' : ''
                  }`}>
                    {match.teams.home.name || "Unknown Team"}
                  </div>

                  <div className="flex-shrink-0 mx-1 flex items-center justify-center">
                    <img
                      src={match.teams.home.logo || "/assets/fallback-logo.svg"}
                      alt={match.teams.home.name}
                      className="w-9 h-9 object-cover rounded-full"
                      style={{
                        aspectRatio: "1/1",
                        minWidth: "36px",
                        minHeight: "36px",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/assets/fallback-logo.svg") {
                          target.src = "/assets/fallback-logo.svg";
                        }
                      }}
                    />
                  </div>

                  {/* Score/Time Center - Fixed width to maintain position */}
                  <div className="flex flex-col items-center justify-center px-4 w-[80px] flex-shrink-0 relative h-12">
                    {(() => {
                      const status = match.fixture.status.short;
                      const fixtureDate = parseISO(match.fixture.date);

                      // Live matches
                      if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
                        return (
                          <div className="relative">
                            <div className="text-lg font-bold flex items-center gap-2">
                              <span className="text-black">{match.goals.home ?? 0}</span>
                              <span className="text-gray-400">-</span>
                              <span className="text-black">{match.goals.away ?? 0}</span>
                            </div>
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                              <span className="text-red-600 animate-pulse bg-white px-1 rounded">
                                {status === 'HT' ? 'HT' : `${match.fixture.status.elapsed || 0}'`}
                              </span>
                            </div>
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
                        const homeScore = match.goals?.home;
                        const awayScore = match.goals?.away;
                        const hasValidScores =
                          homeScore !== null &&
                          homeScore !== undefined &&
                          awayScore !== null &&
                          awayScore !== undefined &&
                          !isNaN(Number(homeScore)) &&
                          !isNaN(Number(awayScore));

                        if (hasValidScores) {
                          return (
                            <div className="relative">
                              <div className="text-lg font-bold flex items-center gap-2">
                                <span className="text-black">{homeScore}</span>
                                <span className="text-gray-400">-</span>
                                <span className="text-black">{awayScore}</span>
                              </div>
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                <span className="text-gray-600 bg-white px-1 rounded">
                                  {status === "FT" ? "Ended" : status}
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="relative">
                              <div className="text-sm font-medium text-gray-900">
                                {format(fixtureDate, "HH:mm")}
                              </div>
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                <span className="text-gray-600 bg-white px-1 rounded">
                                  {status === "FT" ? "No Score" : status}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      }

                      // Upcoming matches
                      return (
                        <div className="relative flex items-center justify-center h-full">
                          <div className="text-base font-medium text-black">
                            {status === "TBD"
                              ? "TBD"
                              : format(fixtureDate, "HH:mm")}
                          </div>
                          {status === "TBD" && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs">
                              <span className="text-gray-500 bg-white px-1 rounded">
                                Time TBD
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex-shrink-0 mx-1 flex items-center justify-center">
                    <img
                      src={match.teams.away.logo || "/assets/fallback-logo.svg"}
                      alt={match.teams.away.name}
                      className="w-9 h-9 object-cover rounded-full"
                      style={{
                        aspectRatio: "1/1",
                        minWidth: "36px",
                        minHeight: "36px",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/assets/fallback-logo.svg") {
                          target.src = "/assets/fallback-logo.svg";
                        }
                      }}
                    />
                  </div>

                  {/* Away Team - Fixed width for consistency */}
                  <div className={`away-team-name ${
                    match.goals.home !== null && match.goals.away !== null && 
                    match.goals.away > match.goals.home ? 'winner' : ''
                  }`}>
                    {match.teams.away.name || "Unknown Team"}
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