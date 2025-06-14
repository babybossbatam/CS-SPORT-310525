typescript
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useCachedQuery } from "@/lib/cachingHelper";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import { isNationalTeam } from "@/lib/teamLogoSources";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyImage from "../common/LazyImage";
import LazyMatchItem from "./LazyMatchItem";

interface MyNewPopularLeagueProps {
  selectedDate: string;
}

// Helper function to shorten team names
const shortenTeamName = (teamName: string): string => {
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

const MyNewPopularLeague: React.FC<MyNewPopularLeagueProps> = ({
  selectedDate,
}) => {
  const [starredCompetitions, setStarredCompetitions] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<string>>(
    new Set(),
  );
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Major competitions mapping with their league IDs (All World Leagues)
  const MAJOR_COMPETITIONS = {
    "Euro Championship": [4],
    "UEFA U21 Championship": [38], // Moved to top priority
    "FIFA Club World Cup": [15], // High priority
    "Confederations Cup": [21],
    "World Cup": [1],
    "Asian Games": [803],
    "Caribbean Cup": [804],
    "UEFA Champions League": [2],
    "Asian Cup": [7],
    "Olympics Men": [480],
    "CECAFA Senior Challenge Cup": [535],
    "SAFF Championship": [28],
    "UEFA Europa League": [3],
    "World Cup - Qualification Intercontinental Play-offs": [37],
    "AFC Challenge Cup": [807],
    "African Nations Championship": [19],
    "AFF Championship": [24],
    "CONCACAF Gold Cup": [22],
    "EAFF E-1 Football Championship": [23],
    "OFC Champions League": [27],
    "Africa Cup of Nations": [6],
    "Copa America": [9],
    "UEFA Super Cup": [531],
    "CONCACAF Champions League": [16],
    "AFC Champions League": [17],
    "Gulf Cup of Nations": [25],
    "International Champions Cup": [26],
    "Copa Centroamericana": [805],
    "OFC Nations Cup": [806],
    "China Cup": [766],
    "Friendlies": [10],
    "UEFA Youth League": [14],
    "AFC Cup": [18],
    "CAF Confederation Cup": [20],
    "World Cup - U20": [490],
    "UEFA Nations League": [5],
    "CONCACAF Nations League - Qualification": [808],
    "World Cup - Qualification CONCACAF": [31],
    "World Cup - Qualification Europe": [32],
    "World Cup - Qualification Oceania": [33],
    "World Cup - Qualification South America": [34],
    "World Cup - Qualification Africa": [29],
    "World Cup - Qualification Asia": [30],
    "UEFA U19 Championship": [493],
    "CONCACAF U20": [537],
    "Asian Cup - Qualification": [35],
    "CAF Super Cup": [533],
    "CONCACAF Caribbean Club Shield": [534],
    "CONMEBOL Sudamericana": [11],
    "CAF Champions League": [12],
    "CONMEBOL Libertadores": [13],
    "Arab Club Champions Cup": [768],
    "Premier League Asia Trophy": [769],
    "Pacific Games": [770],
    "Leagues Cup": [772],
    "Sudamericano U20": [773],
    "World Cup - U17": [587],
    "CONCACAF League": [767],
    "COSAFA U20 Championship": [771],
    "Baltic Cup": [849],
    "AFC U23 Asian Cup": [532],
    "CONCACAF Nations League": [536],
    "Africa Cup of Nations U20": [538],
    "CONMEBOL Libertadores U20": [540],
    "CONMEBOL Recopa": [541],
    "Olympics Men - Qualification Concacaf": [881],
    "Campeones Cup": [885],
    "Friendlies Clubs": [667],
    "UEFA Europa Conference League": [848],
    "CONCACAF Caribbean Club Championship": [856],
    "CONCACAF Gold Cup - Qualification": [858],
    "COSAFA Cup": [859],
    "Arab Cup": [860],
    "Youth Viareggio Cup": [910],
    "CECAFA Club Cup": [869],
    "U20 Elite League": [890],
    "Algarve Cup": [902],
    "The Atlantic Cup": [903],
    "Africa Cup of Nations - Qualification": [36],
    "CONMEBOL Libertadores Femenina": [949],
    "South American Youth Games": [951],
    "AFC U23 Asian Cup - Qualification": [952],
    "Africa U23 Cup of Nations - Qualification": [953],
    "UEFA U17 Championship - Qualification": [886],
    "UEFA U19 Championship - Qualification": [893],
    "Tipsport Malta Cup": [900],
    "SheBelieves Cup": [904],
    "CAC Games": [1016],
    "AFF U23 Championship": [908],
    "Southeast Asian Games": [911],
    "CONMEBOL - UEFA Finalissima": [913],
    "Tournoi Maurice Revello": [914],
    "Kirin Cup": [916],
    "Mediterranean Games": [919],
    "UEFA U17 Championship": [921],
    "Copa America Femenina": [926],
    "AFF U19 Championship": [928],
    "Arab Championship - U20": [934],
    "Emirates Cup": [937],
    "COTIF Tournament": [940],
    "Islamic Solidarity Games": [941],
    "King's Cup": [1038],
    "Premier League International Cup": [1039],
    "African Football League": [1043],
    "Pan American Games": [1045],
    "All Africa Games": [1072],
    "Euro Championship - Qualification": [960],
    "CONCACAF U17": [963],
    "AFC U20 Asian Cup": [965],
    "CONMEBOL - U17": [970],
    "CAF Cup of Nations - U17": [973],
    "CAFA Nations Cup": [1008],
    "AFC U17 Asian Cup": [1012],
    "CAF U23 Cup of Nations": [1015],
    "UEFA - CONMEBOL - Club Challenge": [1024],
    "Concacaf Central American Cup": [1028],
    "UEFA U21 Championship - Qualification": [850],
    "AFC U20 Asian Cup - Qualification": [1153],
    "CECAFA U20 Championship": [1159],
    "AFC U17 Asian Cup - Qualification": [1161],
    "AGCFF Gulf Champions League": [1162],
    "African Nations Championship - Qualification": [1163],
    "CONMEBOL - Pre-Olympic Tournament": [1060],
    "CONCACAF U20 - Qualification": [1066],
    "WAFF Championship U23": [1077],
    "CONMEBOL - U17 Femenino": [1081],
    "CONMEBOL U20 Femenino": [1085],
    "UAE-Qatar - Super Shield": [1089],
    "Olympics - Intercontinental Play-offs": [1105],
    "OFC U19 Championship": [1122],
    "Qatar-UAE Super Cup": [1123],
    "ASEAN Club Championship": [1129],
    "AFC Challenge League": [1132],
    "CONCACAF W Champions Cup": [1136],
    "FIFA Intercontinental Cup": [1168],
    "EAFF E-1 Football Championship - Qualification": [1169],
    "FIFA Club World Cup - Play-In": [1186],
  };

  // Smart cache duration based on date type
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const cacheMaxAge = isFuture
    ? 4 * 60 * 60 * 1000
    : isToday
      ? 2 * 60 * 60 * 1000
      : 30 * 60 * 1000;

  // Fetch all fixtures for the selected date
  const {
    data: fixtures = [],
    isLoading,
    isFetching,
  } = useCachedQuery(
    ["major-competitions-fixtures", selectedDate],
    async () => {
      console.log(
        `🔄 [MyNewPopularLeague] Fetching data for date: ${selectedDate}`,
      );
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();
      console.log(
        `✅ [MyNewPopularLeague] Received ${data?.length || 0} fixtures for ${selectedDate}`,
      );
      return data;
    },
    {
      enabled: !!selectedDate,
      maxAge: cacheMaxAge,
      backgroundRefresh: false,
      staleTime: cacheMaxAge,
      gcTime: cacheMaxAge * 2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  // Filter and group fixtures by major competitions
  const majorCompetitionsData = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(
      `🔍 [MyNewPopularLeague] Processing ${fixtures.length} fixtures for major competitions`,
    );

    const competitionsWithMatches: Array<{
      name: string;
      icon: string;
      matchCount: number;
      matches: any[];
      leagueIds: number[];
    }> = [];

    // Process each major competition
    Object.entries(MAJOR_COMPETITIONS).forEach(([competitionName, leagueIds]) => {
      const competitionMatches = fixtures.filter((fixture) => {
        // Check if fixture belongs to this competition
        const belongsToCompetition = leagueIds.includes(fixture.league?.id);

        if (!belongsToCompetition) return false;

        // Apply smart time filtering
        if (fixture.fixture.date && fixture.fixture.status?.short) {
          const smartResult = MySmartTimeFilter.getSmartTimeLabel(
            fixture.fixture.date,
            fixture.fixture.status.short,
            selectedDate + "T12:00:00Z",
          );

          const shouldInclude = (() => {
            const today = format(new Date(), "yyyy-MM-dd");
            const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");

            if (selectedDate === tomorrow && smartResult.label === "tomorrow") return true;
            if (selectedDate === today && smartResult.label === "today") return true;
            if (selectedDate === yesterday && smartResult.label === "yesterday") return true;

            // Custom dates
            if (
              selectedDate !== today &&
              selectedDate !== tomorrow &&
              selectedDate !== yesterday
            ) {
              if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
            }

            return false;
          })();

          return shouldInclude;
        }

        return true;
      });

      if (competitionMatches.length > 0) {
        competitionsWithMatches.push({
          name: competitionName,
          icon: "🏆",
          matchCount: competitionMatches.length,
          matches: competitionMatches,
          leagueIds,
        });
      }
    });

    // Sort by match count (descending) and then by name
    competitionsWithMatches.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.name.localeCompare(b.name);
    });

    console.log(
      `🏆 [MyNewPopularLeague] Found ${competitionsWithMatches.length} major competitions with matches`,
    );

    return competitionsWithMatches;
  }, [fixtures, selectedDate]);

  const toggleStarCompetition = (competitionName: string) => {
    const competitionHash = competitionName.replace(/\s+/g, "").toLowerCase().hashCode();
    setStarredCompetitions((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(competitionHash)) {
        newStarred.delete(competitionHash);
      } else {
        newStarred.add(competitionHash);
      }
      return newStarred;
    });
  };

  const toggleCompetitionExpansion = (competitionName: string) => {
    setExpandedCompetitions((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(competitionName)) {
        newExpanded.delete(competitionName);
      } else {
        newExpanded.add(competitionName);
      }
      return newExpanded;
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

  // Add hashCode method to String prototype for simple hashing
  declare global {
    interface String {
      hashCode(): number;
    }
  }

  String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const showLoading = (isLoading && !fixtures?.length) || (isFetching && !fixtures?.length);

  if (showLoading) {
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
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
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

  if (!majorCompetitionsData.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No major competitions available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        🔥 Major Competitions
      </CardHeader>

      {/* Competition Cards with Team Display */}
      {majorCompetitionsData.map((competition, index) => {
        const competitionHash = competition.name.replace(/\s+/g, "").toLowerCase().hashCode();
        const isStarred = starredCompetitions.has(competitionHash);
        const isExpanded = expandedCompetitions.has(competition.name);

        return (
          <Card
            key={`${competition.name}-${index}`}
            className="border bg-card text-card-foreground shadow-md overflow-hidden mb-2"
          >
            {/* Competition Header */}
            <CardContent className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
              {/* Star Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStarCompetition(competition.name);
                }}
                className="transition-colors"
                title={`${isStarred ? "Remove from" : "Add to"} favorites`}
              >
                <Star
                  className={`h-5 w-5 transition-all ${
                    isStarred
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              </button>

              {/* Competition Icon */}
              <span className="text-xl">{competition.icon}</span>

              {/* Competition Details - Clickable to expand */}
              <div 
                className="flex flex-col flex-1 cursor-pointer"
                onClick={() => toggleCompetitionExpansion(competition.name)}
              >
                <span
                  className="font-semibold text-gray-800"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "13.3px",
                  }}
                >
                  {competition.name}
                </span>
                <span
                  className="text-gray-600"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "11px",
                  }}
                >
                  {competition.matchCount} match{competition.matchCount !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleCompetitionExpansion(competition.name)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={isExpanded ? "Collapse matches" : "Show matches"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>

              {/* Match Count Badge */}
              <div className="flex gap-1">
                <span
                  className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium"
                  style={{ fontSize: "calc(0.75rem * 0.85)" }}
                >
                  {competition.matchCount}
                </span>
              </div>
            </CardContent>

            {/* Team Matches - Show when expanded */}
            {isExpanded && (
              <div className="match-cards-wrapper">
                {competition.matches
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
                  })
                  .map((match: any) => {
                    // Debug log to help identify Euro U21 and FIFA Club World Cup matches
                    if (competition.name.includes("U21") || competition.name.includes("FIFA") || competition.name.includes("World Cup")) {
                      console.log(`🏆 [${competition.name}] Match found:`, {
                        id: match.fixture.id,
                        date: match.fixture.date,
                        status: match.fixture.status.short,
                        home: match.teams.home.name,
                        away: match.teams.away.name,
                        time: format(parseISO(match.fixture.date), "HH:mm"),
                        leagueId: match.league.id,
                        leagueName: match.league.name
                      });
                    }

                    return (
                    <LazyMatchItem key={match.fixture.id}>
                      <div
                        key={match.fixture.id}
                        className="match-card-container group"
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

                              // Finished matches status - check this FIRST and RETURN immediately
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

                              // Live matches status - only check if NOT finished
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
                                  <div className="match-status-label status-live">
                                    {status === "HT"
                                      ? "Halftime"
                                      : `${match.fixture.status.elapsed || 0}'`}
                                  </div>
                                );
                              }

                              // Postponed matches status
                              if (status === "PST") {
                                return (
                                  <div className="match-status-label status-postponed">
                                    Postponed
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
                              {isNationalTeam(
                                match.teams.home,
                                { id: competition.leagueIds[0] },
                              ) ? (
                                <MyCircularFlag
                                  teamName={match.teams.home.name}
                                  fallbackUrl={match.teams.home.logo}
                                  alt={match.teams.home.name}
                                  size="34px"
                                  className="popular-leagues-size"
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
                                    filter:
                                      "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                  }}
                                  fallbackSrc="/assets/fallback-logo.svg"
                                />
                              )}
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
                                    awayScore !==null &&
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
                              {isNationalTeam(
                                match.teams.away,
                                { id: competition.leagueIds[0] },
                              ) ? (
                                <MyCircularFlag
                                  teamName={match.teams.away.name}
                                  fallbackUrl={match.teams.away.logo}
                                  alt={match.teams.away.name}
                                  size="34px"
                                  className="popular-leagues-size"
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
                                    filter:
                                      "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                  }}
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
                    </LazyMatchItem>
                    );
                  })}
              </div>
            )}
          </Card>
        );
      })}
    </>
  );
};

export default MyNewPopularLeague;