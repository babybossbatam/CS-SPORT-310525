
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Star } from "lucide-react";
import { format, parseISO, isValid, differenceInHours, subDays, addDays } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { isToday, isYesterday, isTomorrow } from "@/lib/dateUtilsUpdated";
import "../../styles/MyLogoPositioning.css";
import LazyImage from "../common/LazyImage";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/MyAPIFallback';

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
  todayPopularFixtures?: any[]; // Accept TodayPopularFootballLeaguesNew fixtures as props
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
  todayPopularFixtures: propsFixtures,
}) => {
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

  // Fetch fixtures only if not provided via props (same logic as LiveMatchByTime)
  const { data: fetchedFixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures-date", selectedDate],
    queryFn: async () => {
      console.log("🕐 [TodayMatchByTime] Fetching fixtures for date:", selectedDate);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}`);
      const data = await response.json();
      return data || [];
    },
    enabled: !propsFixtures, // Only fetch if props not provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use props fixtures if available, otherwise use fetched fixtures
  const allFixtures = propsFixtures || fetchedFixtures;

  console.log(`🕐 [TodayMatchByTime] Using ${allFixtures.length} fixtures from props`);

  // Apply live filtering if both filters are active
  const finalMatches = useMemo(() => {
    if (liveFilterActive && timeFilterActive) {
      return allFixtures.filter((fixture) => {
        const status = fixture.fixture.status.short;
        return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
      });
    }
    return allFixtures;
  }, [allFixtures, liveFilterActive, timeFilterActive]);

  // Sort matches by time, then by status
  const sortedMatches = useMemo(() => {
    return finalMatches.sort((a, b) => {
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

      // Define status categories
      const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      const aUpcoming = aStatus === "NS" || aStatus === "TBD";
      const bUpcoming = bStatus === "NS" || bStatus === "TBD";

      const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
      const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

      // PRIORITY 1: LIVE matches first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // If both are LIVE, sort by elapsed time (shortest first)
      if (aLive && bLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

      // PRIORITY 2: Upcoming (NS/TBD) matches come second, sorted by time
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // If both are upcoming, sort by time
      if (aUpcoming && bUpcoming) {
        return aTime - bTime; // Earlier matches first
      }

      // PRIORITY 3: Finished matches come last, sorted by time (latest first)
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;

      // If both are finished, sort by time (latest first)
      if (aFinished && bFinished) {
        return bTime - aTime;
      }

      // DEFAULT: Sort by time
      return aTime - bTime;
    });
  }, [finalMatches]);

  // Get header title based on button states and selected date
  const getHeaderTitle = () => {
    // Check for different button states first
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (!liveFilterActive && timeFilterActive) {
      return "Popular Leagues by Time";
    }

    // Default behavior based on selected date
    const selectedDateObj = new Date(selectedDate);

    if (isToday(selectedDateObj)) {
      return "Today's Popular Leagues by Time";
    } else if (isYesterday(selectedDateObj)) {
      return "Yesterday's Popular Leagues by Time";
    } else if (isTomorrow(selectedDateObj)) {
      return "Tomorrow's Popular Leagues by Time";
    } else {
      return `Popular Leagues - ${format(selectedDateObj, "MMM d, yyyy")}`;
    }
  };

  // Show loading if we don't have props and are still fetching
  if (!propsFixtures && isLoading) {
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
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        {getHeaderTitle()}
      </div>
      
      {/* Single consolidated card with ALL matches sorted by time */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match) => (
              <div key={match.fixture.id} className="match-card-container group">
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
                      { name: match.league?.name, country: match.league?.country },
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
                          style={{ 
                            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                          }}
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
                        style={{ 
                          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                        }}
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
                              <div className="match-status-label status-postponed">
                                {statusText}
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
                            <div className="match-status-label status-postponed">
                              {statusText}
                            </div>
                          </div>
                        );
                      }

                      // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                      return (
                        <div className="relative flex items-center justify-center h-full">
                          <div className="match-time-display" style={{ fontSize: '0.882em' }}>
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
                      { name: match.league?.name, country: match.league?.country },
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
                          style={{ 
                            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                          }}
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
                        style={{ 
                          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
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
                    {match.teams.away.name || "Unknown Team"}
                  </div>

                  {/* League and Competition Info */}
                  <div className="match-league-info">
                    <div className="text-xs text-gray-500 truncate">
                      {match.league?.name}
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
