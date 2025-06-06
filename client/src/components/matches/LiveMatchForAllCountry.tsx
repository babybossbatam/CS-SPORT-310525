import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NoLiveMatchesEmpty from "@/components/matches/NoLiveMatchesEmpty";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { countryCodeMap } from "@/lib/flagUtils";
import { getTeamLogoSources, isNationalTeam, createTeamLogoErrorHandler } from "@/lib/teamLogoSources";
import { MySmartDateLabeling } from "@/lib/MySmartDateLabeling";
import { 
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureOnClientDate,
  safeSubstring
} from '@/lib/dateUtilsUpdated';
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import LazyImage from "../common/LazyImage";
import "@/styles/MyLogoPositioning.css";

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

  // Apply smart time filtering first
  const filteredFixtures = fixtures.filter((fixture: any) => {
    if (fixture.fixture.date && fixture.fixture.status?.short) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');

      const smartResult = MySmartTimeFilter.getSmartTimeLabel(
        fixture.fixture.date,
        fixture.fixture.status.short,
        todayString + 'T12:00:00Z' // Use today as context for live matches
      );

      // For live matches, we want to show matches that are live or recently finished today
      if (smartResult.label === 'today' && smartResult.isWithinTimeRange) {
        return true;
      }

      console.log(`❌ [LIVE FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`, {
        fixtureDate: fixture.fixture.date,
        status: fixture.fixture.status.short,
        reason: smartResult.reason,
        label: smartResult.label,
        isWithinTimeRange: smartResult.isWithinTimeRange
      });
      return false;
    }
    return true;
  });

  // Group fixtures by country
  const fixturesByCountry = filteredFixtures.reduce((acc: any, fixture: any) => {
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
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        {liveFilterActive && timeFilterActive
          ? "Popular Football Live Score"
          : liveFilterActive && !timeFilterActive
            ? "Popular Football Live Score"
            : !liveFilterActive && timeFilterActive
              ? "All Matches by Time"
              : "Popular Football Live Score"}
      </CardHeader>
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
                              {match.teams.home.name || "Unknown Team"}
                            </div>

                            {/* Home team logo - grid area */}
                            <div className="home-team-logo-container">
                              {isNationalTeam(
                                match.teams.home,
                                leagueData.league,
                              ) ? (
                                <div className="flag-circle">
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
                                  <div className="gloss"></div>
                                </div>
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
                                  style={{ backgroundColor: "transparent" }}
                                  fallbackSrc="/assets/fallback-logo.svg"
                                />
                              )}
                            </div>

                            {/* Score/Time Center - Fixed width and centered */}
                            <div className="match-score-container">
                              {(() => {
                                const status = match.fixture.status.short;
                                const fixtureDate = parseISO(match.fixture.date);

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
                                    <div className="relative">
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
                                      <div className="match-status-label status-live">
                                        {status === "HT"
                                          ? "Halftime"
                                          : `${match.fixture.status.elapsed || 0}'`}
                                      </div>
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
                                      <div className="relative">
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
                                      </div>
                                    );
                                  } else {
                                    // Match is finished but no valid score data
                                    const statusText =
                                      status === "FT"
                                        ? "No Score"
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
                                                      : "No Score";

                                    return (
                                      <div className="relative">
                                        <div className="text-sm font-medium text-gray-900">
                                          {format(fixtureDate, "HH:mm")}
                                        </div>
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                          <span className="text-gray-600 bg-white px-1 rounded">
                                            {statusText}
                                          </span>
                                        </div>
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
                                    <div className="relative">
                                      <div className="text-sm font-medium text-gray-900">
                                        {format(fixtureDate, "HH:mm")}
                                      </div>
                                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                        <span className="text-red-600 bg-white px-1 rounded">
                                          {statusText}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }

                                // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                return (
                                  <div className="relative flex items-center justify-center h-full">
                                    <div className="match-time-display">
                                      {status === "TBD"
                                        ? "TBD"
                                        : format(fixtureDate, "HH:mm")}
                                    </div>
                                    {status === "TBD" && (
                                      <div className="match-status-label status-upcoming">
                                        Time TBD
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Away team logo - grid area */}
                            <div className="away-team-logo-container">
                              {isNationalTeam(
                                match.teams.away,
                                leagueData.league,
                              ) ? (
                                <div className="flag-circle">
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
                                  <div className="gloss"></div>
                                </div>
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
                                  style={{ backgroundColor: "transparent" }}
                                  fallbackSrc="/assets/fallback-logo.svg"
                                />
                              )}
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
                              {match.teams.away.name || "Unknown Team"}
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