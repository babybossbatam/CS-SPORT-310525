
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues } from "@/lib/MyPopularLeagueExclusion";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import { isNationalTeam } from "@/lib/teamLogoSources";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";

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

  const POPULAR_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 848, 15, 914]; // Popular league IDs
  const POPULAR_COUNTRIES_ORDER = [
    "England", "Spain", "Italy", "Germany", "France", "World", "Europe",
    "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia",
    "United States", "USA", "US", "United Arab Emirates", "United-Arab-Emirates"
  ];

  // Fetch all fixtures for the selected date
  const {
    data: fixtures = [],
    isLoading,
  } = useQuery({
    queryKey: ["all-fixtures-by-date", currentDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/fixtures/date/${currentDate}?all=true`);
      const data = await response.json();
      return data;
    },
    enabled: !!currentDate,
  });

  // Filter and process all matches into a single list
  const allMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = format(tomorrow, "yyyy-MM-dd");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    const filtered = fixtures.filter((fixture: any) => {
      // Apply smart time filtering
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          currentDate + "T12:00:00Z",
        );

        const shouldInclude = (() => {
          if (currentDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (currentDate === todayString && smartResult.label === "today") return true;
          if (currentDate === yesterdayString && smartResult.label === "yesterday") return true;
          if (
            currentDate !== todayString &&
            currentDate !== tomorrowString &&
            currentDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }
          return false;
        })();

        if (!shouldInclude) return false;
      }

      // Filter for popular leagues and countries
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      // Apply exclusion filters
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          country,
        )
      ) {
        return false;
      }

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Check if it's an international competition
      const isInternationalCompetition =
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    // Apply live filter if active
    const liveFiltered = liveFilterActive
      ? filtered.filter((match: any) => 
          match.fixture.status.short === "LIV" || match.fixture.status.short === "HT"
        )
      : filtered;

    // Sort matches by priority: Live > Upcoming > Finished
    return liveFiltered.sort((a: any, b: any) => {
      const now = new Date();
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;

      if (!isValid(aDate) || !isValid(bDate)) return 0;

      const aTime = aDate.getTime();
      const bTime = bDate.getTime();
      const nowTime = now.getTime();

      // Live matches priority
      const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // Upcoming matches
      const aUpcoming = aStatus === "NS" || aStatus === "TBD";
      const bUpcoming = bStatus === "NS" || bStatus === "TBD";

      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      if (aUpcoming && bUpcoming) {
        const aDistance = Math.abs(aTime - nowTime);
        const bDistance = Math.abs(bTime - nowTime);
        return aDistance - bDistance;
      }

      // Default sort by time proximity
      const aDistance = Math.abs(aTime - nowTime);
      const bDistance = Math.abs(bTime - nowTime);
      return aDistance - bDistance;
    });
  }, [fixtures, currentDate, liveFilterActive]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          Popular Leagues by Time
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading matches...</div>
        </CardContent>
      </Card>
    );
  }

  if (!allMatches.length) {
    return (
      <Card>
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          Popular Leagues by Time
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
        Popular Leagues by Time
      </CardHeader>

      {/* Single Card with All Matches */}
      <Card className="border bg-card text-card-foreground shadow-md overflow-hidden mb-4">
        <CardContent className="p-0">
          <div className="space-y-0">
            {allMatches.map((match: any) => (
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
                          const hasValidScores = homeScore !== null && homeScore !== undefined && 
                                                awayScore !== null && awayScore !== undefined;

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

                        // Postponed matches
                        if (["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)) {
                          const statusText = status === "PST" ? "Postponed" : status;
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

                        // Upcoming matches
                        return (
                          <div className="relative flex items-center justify-center h-full">
                            <div className="match-time-display" style={{ fontSize: '0.882em' }}>
                              {status === "TBD" ? "TBD" : format(fixtureDate, "HH:mm")}
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
