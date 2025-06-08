
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues } from "@/lib/MyPopularLeagueExclusion";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import { isNationalTeam } from "../../lib/teamLogoSources";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import "../../styles/MyLogoPositioning.css";

interface TodayMatchByTimeProps {
  selectedDate?: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
}) => {
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

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

  // Use current date if selectedDate is not provided
  const currentDate = selectedDate || new Date().toISOString().slice(0, 10);

  // Fetch all fixtures for the selected date
  const {
    data: fixtures = [],
    isLoading,
  } = useQuery({
    queryKey: ["all-fixtures-by-date", currentDate],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${currentDate}?all=true`,
      );
      const data = await response.json();
      return data;
    },
    enabled: !!currentDate,
  });

  // Filter and sort all matches by time
  const sortedMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    // Filter matches based on smart time filtering
    const filtered = fixtures.filter((fixture: any) => {
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return false;
      }

      // Apply smart time filtering
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          currentDate + "T12:00:00Z",
        );

        // Check if this match should be included based on the selected date
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().slice(0, 10);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().slice(0, 10);

        const shouldInclude = (() => {
          if (currentDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (currentDate === today && smartResult.label === "today") return true;
          if (currentDate === yesterdayString && smartResult.label === "yesterday") return true;
          if (currentDate !== today && currentDate !== tomorrowString && currentDate !== yesterdayString) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }
          return false;
        })();

        if (!shouldInclude) return false;
      }

      // Apply exclusion filters
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.league.country,
        )
      ) {
        return false;
      }

      // Apply live filter if active
      if (liveFilterActive) {
        return (
          fixture.fixture.status.short === "LIV" ||
          fixture.fixture.status.short === "HT"
        );
      }

      return true;
    });

    // Sort all matches by time
    return filtered.sort((a: any, b: any) => {
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
      const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      const aUpcoming = aStatus === "NS" || aStatus === "TBD";
      const bUpcoming = bStatus === "NS" || bStatus === "TBD";

      const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
      const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

      // PRIORITY 1: LIVE matches always come first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // If both are LIVE, sort by elapsed time (shortest first)
      if (aLive && bLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

      // PRIORITY 2: Upcoming matches, sorted by time
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      if (aUpcoming && bUpcoming) {
        return aTime - bTime; // Sort by match time (earliest first)
      }

      // PRIORITY 3: Recently finished matches
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;

      if (aFinished && bFinished) {
        return bTime - aTime; // Most recent finished first
      }

      // DEFAULT: Sort by time
      return aTime - bTime;
    });
  }, [fixtures, currentDate, liveFilterActive]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          Today's Matches by Time
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Loading matches...</p>
        </CardContent>
      </Card>
    );
  }

  if (!sortedMatches.length) {
    return (
      <Card>
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          Today's Matches by Time
        </CardHeader>
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
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Today's Matches by Time
      </CardHeader>

      {/* Single Card with All Matches */}
      <Card className="border bg-card text-card-foreground shadow-md overflow-hidden mb-4">
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match: any) => (
              <LazyMatchItem key={match.fixture.id}>
                <div className="match-card-container group">
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
                      {isNationalTeam(match.teams.home, match.league) ? (
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

                    {/* Score/Time Center */}
                    <div className="match-score-container">
                      {(() => {
                        const status = match.fixture.status.short;
                        const fixtureDate = parseISO(match.fixture.date);

                        // Live matches
                        if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                          return (
                            <div className="relative">
                              <div className="match-score-display">
                                <span className="score-number">{match.goals.home ?? 0}</span>
                                <span className="score-separator">-</span>
                                <span className="score-number">{match.goals.away ?? 0}</span>
                              </div>
                              <div className="match-status-label status-live">
                                {status === "HT" ? "Halftime" : `${match.fixture.status.elapsed || 0}'`}
                              </div>
                            </div>
                          );
                        }

                        // Finished matches
                        if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                          const homeScore = match.goals.home;
                          const awayScore = match.goals.away;
                          const hasValidScores =
                            homeScore !== null && homeScore !== undefined &&
                            awayScore !== null && awayScore !== undefined &&
                            !isNaN(Number(homeScore)) && !isNaN(Number(awayScore));

                          if (hasValidScores) {
                            return (
                              <div className="relative">
                                <div className="match-score-display">
                                  <span className="score-number">{homeScore}</span>
                                  <span className="score-separator">-</span>
                                  <span className="score-number">{awayScore}</span>
                                </div>
                                <div className="match-status-label status-ended">
                                  {status === "FT" ? "Ended" : status}
                                </div>
                              </div>
                            );
                          }
                        }

                        // Upcoming matches
                        return (
                          <div className="relative flex items-center justify-center h-full">
                            <div className="match-time-display" style={{ fontSize: '0.882em' }}>
                              {status === "TBD" ? "TBD" : format(fixtureDate, "HH:mm")}
                            </div>
                            {status === "TBD" && (
                              <div className="match-status-label status-upcoming">Time TBD</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Away team logo */}
                    <div className="away-team-logo-container">
                      {isNationalTeam(match.teams.away, match.league) ? (
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
                </div>
              </LazyMatchItem>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;
