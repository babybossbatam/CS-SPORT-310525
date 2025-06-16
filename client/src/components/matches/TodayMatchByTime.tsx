
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
import { useCentralData } from "../../providers/CentralDataProvider";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";

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

interface TodayMatchByTimeProps {
  selectedDate: string;
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

  // Use central data cache
  const { fixtures, liveFixtures, isLoading, error } = useCentralData();

  console.log(`📊 [TodayMatchByTime] Got ${fixtures?.length || 0} fixtures from central cache`);

  // Define shouldExcludeFixture function
  const shouldExcludeFixture = (leagueName: string, homeTeam: string, awayTeam: string): boolean => {
    const excludedLeagues = ["Belarusian"];
    const excludedTeams = ["BATE", "Dinamo Minsk", "Shakhtyor"];

    if (excludedLeagues.some(excludedLeague => leagueName.includes(excludedLeague))) {
      return true;
    }

    if (excludedTeams.some(excludedTeam => homeTeam.includes(excludedTeam) || awayTeam.includes(excludedTeam))) {
      return true;
    }

    return false;
  };

  // Apply component-specific filtering
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) {
      console.log(`⚠️ [TodayMatchByTime] No fixtures available from central cache`);
      return [];
    }

    // Apply smart time filtering
    const timeFilterResult = MySmartTimeFilter.filterTodayFixtures(fixtures, selectedDate);
    const timeFiltered = timeFilterResult.todayFixtures;
    console.log(`📊 [TodayMatchByTime] After time filtering: ${timeFiltered.length} fixtures`);

    // Apply exclusion filtering if needed
    const exclusionFiltered = timeFiltered.filter(fixture => {
      if (!fixture?.league || !fixture?.teams) return false;
      const leagueName = fixture.league.name || '';
      const homeTeam = fixture.teams.home.name || '';
      const awayTeam = fixture.teams.away.name || '';
      return !shouldExcludeFixture(leagueName, homeTeam, awayTeam);
    });

    console.log(`📊 [TodayMatchByTime] After exclusion filtering: ${exclusionFiltered.length} fixtures`);
    return exclusionFiltered;
  }, [fixtures, selectedDate]);

  // Process and sort matches by time
  const allMatches = filteredFixtures.map((fixture: any) => {
    const smartResult = MySmartTimeFilter.getSmartTimeLabel(
      fixture.fixture.date,
      fixture.fixture.status.short,
      selectedDate + 'T12:00:00Z'
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

  // Sort all matches by time
  const sortedMatches = allMatches.sort((a: any, b: any) => {
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
    const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
    const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

    // Check if matches are finished
    const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
    const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

    // Live matches first
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    if (aIsLive && bIsLive) {
      const aElapsed = Number(a.fixture.status.elapsed) || 0;
      const bElapsed = Number(b.fixture.status.elapsed) || 0;
      return aElapsed - bElapsed;
    }

    // Recently finished matches next
    if (aIsFinished && !bIsFinished) return -1;
    if (!aIsFinished && bIsFinished) return 1;
    if (aIsFinished && bIsFinished) {
      return bTime - aTime; // Most recent finished matches first
    }

    // Upcoming matches last (closest to start time first)
    return aTime - bTime;
  });

  if (isLoading) {
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

  if (!sortedMatches.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for {selectedDate}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        {timeFilterActive
          ? `Matches by Time - ${format(parseISO(selectedDate), 'MMM dd, yyyy')}`
          : `All Matches - ${format(parseISO(selectedDate), 'MMM dd, yyyy')}`}
      </CardHeader>

      {/* Matches Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match: any, index: number) => (
              <div
                key={`${match.fixture.id}-${match.fixture.status.elapsed}-${index}`}
                className="country-matches-container"
              >
                <div
                  key={match.fixture.id}
                  className="match-card-container group"
                  onClick={() => onMatchCardClick?.(match)}
                  style={{ cursor: onMatchCardClick ? 'pointer' : 'default' }}
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

                  <div className="match-three-grid-container">
                    {/* Top grid for status */}
                    <div className="match-status-top">
                      {(() => {
                        const status = match.fixture.status.short;

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
                            <div className="match-status-label status-live">
                              {status === "HT"
                                ? "Halftime"
                                : `${match.fixture.status.elapsed || 0}'`}
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

                        // Upcoming matches
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

                    {/* Middle grid for main content */}
                    <div className="match-content-container">
                      {/* Home Team Name */}
                      <div
                        className={`home-team-name ${
                          match.goals.home !== null &&
                          match.goals.away !== null &&
                          match.goals.home > match.goals.away
                            ? "winner"
                            : ""
                        }`}
                      >
                        {shortenTeamName(match.teams.home.name) || "Unknown Team"}
                      </div>

                      {/* Home team logo */}
                      <div className="home-team-logo-container">
                        {isNationalTeam(
                          match.teams.home,
                          match.leagueInfo,
                        ) || match.teams.home.name?.includes("U20") || match.teams.home.name?.includes("U21") ? (
                          <MyCircularFlag
                            teamName={match.teams.home.name || ""}
                            fallbackUrl={
                              match.teams.home.id
                                ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.home.name}
                            size="32px"
                            className=""
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
                            style={{ backgroundColor: "transparent" }}
                            fallbackSrc="/assets/fallback-logo.svg"
                          />
                        )}
                      </div>

                      {/* Score/Time Center */}
                      <div className="match-score-container">
                        {(() => {
                          const status = match.fixture.status.short;
                          const fixtureDate = parseISO(match.fixture.date);

                          // Live matches - show score
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

                          // Finished matches - show final score
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

                          // Upcoming matches - show time
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
                        ) || match.teams.away.name?.includes("U20") || match.teams.away.name?.includes("U21") ? (
                          <MyCircularFlag
                            teamName={match.teams.away.name || ""}
                            fallbackUrl={
                              match.teams.away.id
                                ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.away.name}
                            size="32px"
                            className=""
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
                            style={{ backgroundColor: "transparent" }}
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
                        {shortenTeamName(match.teams.away.name) || "Unknown Team"}
                      </div>
                    </div>

                    {/* Bottom grid for penalty results (if needed) */}
                    <div className="match-penalty-bottom">
                      {/* This can be used for penalty shootout results or other additional info */}
                    </div>
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

export default TodayMatchByTime;
