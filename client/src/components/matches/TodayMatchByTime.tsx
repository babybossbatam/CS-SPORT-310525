
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import { getCountryFlagWithFallbackSync } from "../../lib/flagUtils";
import { isNationalTeam } from "../../lib/teamLogoSources";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";

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
  todayPopularFixtures = [],
}) => {
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const dispatch = useDispatch();
  const favoriteTeams = useSelector((state: RootState) => state.user.favoriteTeams);

  console.log(`🕒 [TodayMatchByTime] Received ${todayPopularFixtures.length} fixtures as props`);
  console.log(`🕒 [TodayMatchByTime] Sample fixtures:`, todayPopularFixtures.slice(0, 3).map(f => ({
    id: f.fixture?.id,
    league: f.league?.name,
    country: f.league?.country,
    homeTeam: f.teams?.home?.name,
    awayTeam: f.teams?.away?.name,
    status: f.fixture?.status?.short,
    date: f.fixture?.date
  })));

  // Sort matches by time without grouping
  const sortedMatches = useMemo(() => {
    if (!todayPopularFixtures.length) {
      console.log(`🕒 [TodayMatchByTime] No fixtures to sort by time`);
      return [];
    }

    // Debug: Show status breakdown of received fixtures
    const statusBreakdown = todayPopularFixtures.reduce((acc, fixture) => {
      const status = fixture.fixture?.status?.short || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`🕒 [TodayMatchByTime] Status breakdown of received fixtures:`, statusBreakdown);

    const validMatches = todayPopularFixtures.filter((fixture) => {
      try {
        const fixtureDate = parseISO(fixture.fixture.date);
        if (!isValid(fixtureDate)) {
          console.warn(`Invalid date for fixture ${fixture.fixture.id}`);
          return false;
        }
        return true;
      } catch (error) {
        console.error(`Error processing fixture ${fixture.fixture.id}:`, error);
        return false;
      }
    });

    // Sort matches by time, then by status priority, then by league name
    const sorted = validMatches.sort((a, b) => {
      try {
        const aDate = parseISO(a.fixture.date);
        const bDate = parseISO(b.fixture.date);
        
        // First, sort by time
        const timeDiff = aDate.getTime() - bDate.getTime();
        if (timeDiff !== 0) return timeDiff;

        // If same time, sort by status (live > upcoming > finished)
        const aStatus = a.fixture.status.short;
        const bStatus = b.fixture.status.short;
        
        const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
        const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        // Finally, sort by league name alphabetically
        return (a.league.name || "").localeCompare(b.league.name || "");
      } catch (error) {
        console.error(`Error sorting fixtures:`, error);
        return 0;
      }
    });

    console.log(`🕒 [TodayMatchByTime] Sorted ${sorted.length} matches by time`);
    return sorted;
  }, [todayPopularFixtures]);

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

  if (!todayPopularFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this time view</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Popular Leagues by Time
      </CardHeader>

      {/* Single card with all matches sorted by time */}
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

                      {/* Score/Status Center */}
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
