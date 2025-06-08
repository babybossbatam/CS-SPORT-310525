
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import { useCachedQuery } from "@/lib/cachingHelper";
import { isNationalTeam } from "@/lib/teamLogoSources";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import "../../styles/MyLogoPositioning.css";

// Use the same helper function as TodayPopularFootballLeaguesNew
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  const suffixesToRemove = [
    "-sc", "-SC", " SC", " FC", " CF", " United", " City", " Islands",
    " Republic", " National Team", " U23", " U21", " U20", " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

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

  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  return shortened.trim();
};

interface TodayMatchByTimeMatchesProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
  maxMatches?: number;
}

const TodayMatchByTimeMatches: React.FC<TodayMatchByTimeMatchesProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
  maxMatches = 50,
}) => {
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Use the exact same filtering logic as TodayPopularFootballLeaguesNew
  const POPULAR_LEAGUES = [2, 3, 848, 39, 140, 135, 78, 61, 45, 48, 143, 137, 81, 66, 301, 233, 914];
  const POPULAR_COUNTRIES_ORDER = [
    "England", "Spain", "Italy", "Germany", "France", "World", "Europe",
    "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia",
    "United States", "USA", "US", "United Arab Emirates", "United-Arab-Emirates",
  ];

  // Cache configuration - same as TodayPopularFootballLeaguesNew
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;
  const cacheMaxAge = isFuture ? 4 * 60 * 60 * 1000 : isToday ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;

  // Fetch fixtures using the same query key as TodayPopularFootballLeaguesNew
  const { data: fixtures = [], isLoading } = useCachedQuery(
    ["all-fixtures-by-date", selectedDate],
    async () => {
      console.log(`🔄 [TodayMatchByTimeMatches] Fetching fresh data for date: ${selectedDate}`);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`✅ [TodayMatchByTimeMatches] Received ${data?.length || 0} fixtures for ${selectedDate}`);
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

  // Apply the exact same filtering logic as TodayPopularFootballLeaguesNew
  const filteredMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`🔍 [TodayMatchByTimeMatches] Processing ${fixtures.length} fixtures for date: ${selectedDate}`);

    const filtered = fixtures.filter((fixture) => {
      // Apply smart time filtering
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z",
        );

        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = format(yesterday, "yyyy-MM-dd");

        const shouldInclude = (() => {
          if (selectedDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (selectedDate === todayString && smartResult.label === "today") return true;
          if (selectedDate === yesterdayString && smartResult.label === "yesterday") return true;
          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
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

      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
        return false;
      }

      // Skip fixtures with null or undefined country
      if (!fixture.league.country) {
        return false;
      }

      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

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
      ? filtered.filter((match) =>
          match.fixture.status.short === "LIV" || match.fixture.status.short === "HT"
        )
      : filtered;

    // Sort matches using the exact same logic as TodayPopularFootballLeaguesNew
    const sorted = liveFiltered.sort((a, b) => {
      const now = new Date();
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;

      if (!isValid(aDate) || !isValid(bDate)) return 0;

      const aTime = aDate.getTime();
      const bTime = bDate.getTime();
      const nowTime = now.getTime();

      // Live matches first
      const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      if (aLive && bLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

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

      // Finished matches
      const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
      const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;

      if (aFinished && bFinished) {
        const aDistance = Math.abs(nowTime - aTime);
        const bDistance = Math.abs(nowTime - bTime);
        return aDistance - bDistance;
      }

      // Default sort by time proximity
      const aDistance = Math.abs(aTime - nowTime);
      const bDistance = Math.abs(bTime - nowTime);
      return aDistance - bDistance;
    });

    return sorted.slice(0, maxMatches);
  }, [fixtures, selectedDate, liveFilterActive, maxMatches]);

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading matches...</p>
        </CardContent>
      </Card>
    );
  }

  if (!filteredMatches.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card text-card-foreground shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="space-y-0">
          {filteredMatches.map((match) => (
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
                    e.currentTarget.closest(".group")?.classList.add("disable-hover");
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.closest(".group")?.classList.remove("disable-hover");
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
                                <span className="score-number">{homeScore}</span>
                                <span className="score-separator">-</span>
                                <span className="score-number">{awayScore}</span>
                              </div>
                              <div className="match-status-label status-ended">
                                {status === "FT" ? "Ended" : status}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="relative">
                              <div className="text-sm font-medium text-gray-900">
                                {format(fixtureDate, "HH:mm")}
                              </div>
                              <div className="match-status-label status-postponed">
                                {status === "FT" ? "No Score" : status}
                              </div>
                            </div>
                          );
                        }
                      }

                      // Postponed matches
                      if (["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)) {
                        return (
                          <div className="relative">
                            <div className="text-sm font-medium text-gray-900">
                              {format(fixtureDate, "HH:mm")}
                            </div>
                            <div className="match-status-label status-postponed">{status}</div>
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
  );
};

export default TodayMatchByTimeMatches;
