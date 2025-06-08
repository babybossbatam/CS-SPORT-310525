
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Star } from "lucide-react";
import { format, parseISO, isValid, differenceInHours, subDays, addDays } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { isToday, isYesterday, isTomorrow } from "@/lib/dateUtilsUpdated";
import { useTodayPopularFixtures } from "../../hooks/useTodayPopularFixtures";
import "../../styles/MyLogoPositioning.css";
import LazyImage from "../common/LazyImage";
import { isNationalTeam } from "../../lib/teamLogoSources";

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
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

  // Use the same filtering logic as TodayPopularFootballLeaguesNew
  const { filteredFixtures, isLoading } = useTodayPopularFixtures(selectedDate);

  console.log(`🕐 [TodayMatchByTime] Using ${filteredFixtures.length} filtered fixtures from shared hook`);

  // Apply live filtering if both filters are active
  const finalMatches = useMemo(() => {
    if (liveFilterActive && timeFilterActive) {
      return filteredFixtures.filter((fixture) => {
        const status = fixture.fixture.status.short;
        return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
      });
    }
    return filteredFixtures;
  }, [filteredFixtures, liveFilterActive, timeFilterActive]);

  // Sort ALL matches by league name A-Z, then by match status priority
  const sortedMatches = useMemo(() => {
    return finalMatches.sort((a, b) => {
      // First: Sort by league name A-Z (ascending)
      const aLeagueName = a.league?.name || "";
      const bLeagueName = b.league?.name || "";
      
      const leagueComparison = aLeagueName.localeCompare(bLeagueName);
      if (leagueComparison !== 0) {
        return leagueComparison;
      }

      // Second: Within same league, sort by match status priority
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

      // If both are LIVE, sort by elapsed time (shortest first), then alphabetically by home team
      if (aLive && bLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;

        if (aElapsed !== bElapsed) {
          return aElapsed - bElapsed;
        }

        // If same elapsed time, sort alphabetically by home team name
        const aHomeTeam = a.teams?.home?.name || "";
        const bHomeTeam = b.teams?.home?.name || "";
        return aHomeTeam.localeCompare(bHomeTeam);
      }

      // PRIORITY 2: Upcoming (NS/TBD) matches come second
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // If both are upcoming, sort by time first, then alphabetically by home team
      if (aUpcoming && bUpcoming) {
        if (aTime !== bTime) {
          return aTime - bTime; // Earlier matches first
        }

        // If same time, sort alphabetically by home team name
        const aHomeTeam = a.teams?.home?.name || "";
        const bHomeTeam = b.teams?.home?.name || "";
        return aHomeTeam.localeCompare(bHomeTeam);
      }

      // PRIORITY 3: Finished matches come last
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;

      // If both are finished, sort alphabetically by home team name
      if (aFinished && bFinished) {
        const aHomeTeam = a.teams?.home?.name || "";
        const bHomeTeam = b.teams?.home?.name || "";
        return aHomeTeam.localeCompare(bHomeTeam);
      }

      // DEFAULT: For any other cases, sort alphabetically by home team name
      const aHomeTeam = a.teams?.home?.name || "";
      const bHomeTeam = b.teams?.home?.name || "";
      return aHomeTeam.localeCompare(bHomeTeam);
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

  // Show loading only if we're actually loading and don't have any cached data
  if (isLoading && !filteredFixtures.length) {
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
      
      {/* Single consolidated card with ALL matches sorted by league A-Z, then by status priority */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match, index) => {
              // Show league header when league changes
              const showLeagueHeader = index === 0 || 
                (sortedMatches[index - 1]?.league?.name !== match.league?.name);

              return (
                <React.Fragment key={match.fixture.id}>
                  {/* League Header - Show when league changes */}
                  {showLeagueHeader && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
                      <img
                        src={match.league?.logo || "/assets/fallback-logo.svg"}
                        alt={match.league?.name || "Unknown League"}
                        className="w-5 h-5 object-contain rounded-full"
                        style={{ backgroundColor: "transparent" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                        }}
                      />
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-gray-800 text-sm">
                          {match.league?.name || "Unknown League"}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {match.league?.country || "Unknown Country"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Match Row */}
                  <div className="match-card-container group">
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
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;
