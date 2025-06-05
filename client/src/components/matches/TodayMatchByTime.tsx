
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours, subDays, addDays } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeFromPopularLeagues, isRestrictedUSLeague } from "@/lib/MyPopularLeagueExclusion";
import { isToday, isYesterday, isTomorrow } from "@/lib/dateUtilsUpdated";
import { getCountryFlagWithFallbackSync } from "@/lib/flagUtils";
import { 
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureOnClientDate 
} from '@/lib/dateUtilsUpdated';
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import "../../styles/MyLogoPositioning.css";

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
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Use the same popular countries and leagues as TodayPopularFootballLeaguesNew
  const POPULAR_COUNTRIES_ORDER = [
    "England",
    "Spain",
    "Italy",
    "Germany",
    "France",
    "World",
    "Europe",
    "South America",
    "Brazil",
    "Saudi Arabia",
    "Egypt",
    "Colombia",
    "United States",
    "USA",
    "US",
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  const POPULAR_LEAGUES_BY_COUNTRY = {
    England: [39, 45, 48], // Premier League, FA Cup, EFL Cup
    Spain: [140, 143], // La Liga, Copa del Rey
    Italy: [135, 137], // Serie A, Coppa Italia
    Germany: [78, 81], // Bundesliga, DFB Pokal
    France: [61, 66], // Ligue 1, Coupe de France
    "United Arab Emirates": [301], // UAE Pro League
    Egypt: [233], // Egyptian Premier League (only major league)
    International: [15], // FIFA Club World Cup as separate category
  };

  const POPULAR_LEAGUES = Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat();

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

  // Fetch all fixtures for the selected date
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      console.log(`Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();

      console.log(`Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Apply the same filtering logic as TodayPopularFootballLeaguesNew (without smart date filtering)
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`Processing ${fixtures.length} fixtures for filtering`);
    const startTime = Date.now();

    const filtered = fixtures.filter((fixture) => {
      // Use simple date matching instead of smart date filtering
      if (fixture.fixture.date) {
        const isOnSelectedDate = isFixtureOnClientDate(fixture.fixture.date, selectedDate);
        if (!isOnSelectedDate) {
          return false;
        }
      }

      // Client-side filtering for popular leagues and countries (same as TodayPopularFootballLeaguesNew)
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) =>
          country.includes(popularCountry.toLowerCase()),
      );

      // Apply exclusion check FIRST, before checking international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

      // Early exclusion for women's competitions and other unwanted matches
      if (shouldExcludeFromPopularLeagues(fixture.league.name, fixture.teams.home.name, fixture.teams.away.name, country)) {
        return false;
      }

      // Check if it's an international competition (after exclusion check)
      const isInternationalCompetition =
        // UEFA competitions (but women's already excluded above)
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        // FIFA competitions
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        // CONMEBOL competitions
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        // Men's International Friendlies (excludes women's)
        (leagueName.includes("friendlies") &&
          !leagueName.includes("women")) ||
        (leagueName.includes("international") &&
          !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return (
        isPopularLeague ||
        isFromPopularCountry ||
        isInternationalCompetition
      );
    });

    const finalFiltered = filtered.filter((fixture) => {
      // Apply popular league exclusion filters (same as TodayPopularFootballLeaguesNew)
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.league.country
        )
      ) {
        return false;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
        return false;
      }

      // Skip fixtures with null or undefined country
      if (!fixture.league.country) {
        return false;
      }

      const countryName = fixture.league.country?.toLowerCase() || "";
      const leagueId = fixture.league.id;
      const leagueNameLower = fixture.league.name?.toLowerCase() || "";

      // Check for international competitions first
      const isInternationalCompetition =
        // UEFA competitions
        leagueNameLower.includes("champions league") ||
        leagueNameLower.includes("europa league") ||
        leagueNameLower.includes("conference league") ||
        leagueNameLower.includes("uefa") ||
        leagueNameLower.includes("euro") ||
        // FIFA competitions
        leagueNameLower.includes("world cup") ||
        leagueNameLower.includes("fifa club world cup") ||
        leagueNameLower.includes("fifa cup") ||
        leagueNameLower.includes("fifa") ||
        // CONMEBOL competitions
        leagueNameLower.includes("conmebol") ||
        leagueNameLower.includes("copa america") ||
        leagueNameLower.includes("copa libertadores") ||
        leagueNameLower.includes("copa sudamericana") ||
        leagueNameLower.includes("libertadores") ||
        leagueNameLower.includes("sudamericana") ||
        // Men's International Friendlies (excludes women's)
        (leagueNameLower.includes("friendlies") &&
          !leagueNameLower.includes("women")) ||
        (leagueNameLower.includes("international") &&
          !leagueNameLower.includes("women")) ||
        countryName.includes("world") ||
        countryName.includes("europe") ||
        countryName.includes("international");

      // Allow all international competitions through
      if (isInternationalCompetition) {
        return true;
      }

      // Check if it's a popular country
      const matchingCountry = POPULAR_COUNTRIES_ORDER.find((country) =>
        countryName.includes(country.toLowerCase()),
      );

      if (!matchingCountry) {
        return false;
      }

      return true;
    });

    const endTime = Date.now();
    console.log(
      `Filtered ${fixtures.length} fixtures to ${finalFiltered.length} in ${endTime - startTime}ms`,
    );

    return finalFiltered;
  }, [fixtures, selectedDate]);

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

  // Sort matches by priority and time
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

      // Check if matches are live
      const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      // Live matches first
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // If both are live, sort by elapsed time ascending (shorter elapsed time first)
      if (aIsLive && bIsLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

      // Check if matches are finished
      const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
      const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

      // Upcoming matches before finished matches
      if (!aIsFinished && bIsFinished) return -1;
      if (aIsFinished && !bIsFinished) return 1;

      // Within same category, sort by time
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
      
      {/* Single consolidated card with all matches sorted by time - no league headers */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match) => (
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
                      className="team-logo"
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
                      className="team-logo"
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

export default TodayMatchByTime;
