
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
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
import { useCachedQuery } from "@/lib/cachingHelper";
import { SimpleDateFilter } from "@/lib/simpleDateFilter";
import { 
  getCountryFlagWithFallbackSync,
  clearVenezuelaFlagCache,
  forceRefreshVenezuelaFlag,
  clearAllFlagCache,
  getCountryCode,
} from "../../lib/flagUtils";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import "../../styles/MyLogoPositioning.css";

// Enhancement leagues - leagues that are popular but not in the main popular leagues list
const ENHANCEMENT_LEAGUES = [
  // Youth/International competitions
  { id: 38, name: "UEFA U21 Championship", country: "Europe", priority: 1 },
  { id: 15, name: "FIFA Club World Cup", country: "World", priority: 2 },
  
  // Additional European competitions
  { id: 16, name: "Copa America", country: "South America", priority: 3 },
  { id: 17, name: "CONCACAF Gold Cup", country: "World", priority: 4 },
  { id: 914, name: "COSAFA Cup", country: "World", priority: 5 },
  { id: 480, name: "Olympic Football Tournament", country: "World", priority: 6 },
  
  // Additional domestic leagues
  { id: 144, name: "Eredivisie", country: "Netherlands", priority: 7 },
  { id: 203, name: "Primeira Liga", country: "Portugal", priority: 8 },
  { id: 235, name: "Russian Premier League", country: "Russia", priority: 9 },
  { id: 88, name: "Pro League", country: "Belgium", priority: 10 },
  
  // Emerging leagues
  { id: 218, name: "Liga MX", country: "Mexico", priority: 11 },
  { id: 71, name: "Serie A", country: "Brazil", priority: 12 },
  { id: 128, name: "Primera División", country: "Argentina", priority: 13 },
  { id: 318, name: "J1 League", country: "Japan", priority: 14 },
  
  // Additional popular leagues that might have matches
  { id: 6, name: "UEFA Nations League", country: "Europe", priority: 15 },
  { id: 894, name: "Asian Cup Women - Qualification", country: "World", priority: 16 },
  { id: 276, name: "FKF Premier League", country: "Kenya", priority: 17 },
  { id: 195, name: "Victoria NPL", country: "Australia", priority: 18 },
  { id: 369, name: "Super League", country: "Uzbekistan", priority: 19 },
  { id: 584, name: "Premier League", country: "Libya", priority: 20 },
  { id: 402, name: "Sudani Premier League", country: "Sudan", priority: 21 },
  { id: 391, name: "Super League", country: "Malawi", priority: 22 },
];

interface EnhancementLeagueProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop10?: boolean;
  liveFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
  useUTCOnly?: boolean; // New prop to control date filtering method
}

const EnhancementLeague: React.FC<EnhancementLeagueProps> = ({
  selectedDate,
  timeFilterActive = false,
  showTop10 = false,
  liveFilterActive = false,
  onMatchCardClick,
  useUTCOnly = true, // Default to UTC-only filtering for consistency
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  const dispatch = useDispatch();
  const { toast } = useToast();
  const favoriteTeams = useSelector((state: RootState) => state.user.favoriteTeams);

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
  const fixturesQueryKey = ["enhancement-fixtures-by-date", selectedDate];

  const {
    data: fixtures = [],
    isLoading,
    isFetching,
  } = useCachedQuery(
    fixturesQueryKey,
    async () => {
      console.log(`🔄 [EnhancementLeague] Fetching fresh data for date: ${selectedDate}`);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`✅ [EnhancementLeague] Received ${data?.length || 0} fixtures for ${selectedDate}`);
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

  // Process fixtures with timezone conversion or UTC-only (configurable)
  const processedFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`🎯 [EnhancementLeague] Processing ${fixtures.length} fixtures`);

    // Use the prop to determine filtering method
    
    const filterResult = useUTCOnly 
      ? SimpleDateFilter.filterFixturesForDateUTCOnly(fixtures, selectedDate)
      : SimpleDateFilter.filterFixturesForDate(fixtures, selectedDate);
    
    console.log(`🌍 [ENHANCEMENT ${useUTCOnly ? 'UTC-ONLY' : 'TIMEZONE'}] Results for ${selectedDate}:`, {
      total: filterResult.stats.total,
      valid: filterResult.stats.valid,
      rejected: filterResult.stats.rejected,
      method: useUTCOnly ? 'UTC-only (consistent date grouping)' : 'Timezone-aware (may show matches on different dates)',
      explanation: useUTCOnly ? 'Matches grouped by UTC date - consistent globally' : 'Matches grouped by local date - varies by timezone'
    });

    return filterResult.validFixtures;
  }, [fixtures, selectedDate]);

  // Filter for enhancement leagues only
  const enhancementFixtures = useMemo(() => {
    if (!processedFixtures?.length) {
      console.log(`🔧 [EnhancementLeague] No processed fixtures available`);
      return [];
    }

    const enhancementLeagueIds = ENHANCEMENT_LEAGUES.map(league => league.id);
    console.log(`🔧 [EnhancementLeague] Looking for enhancement league IDs:`, enhancementLeagueIds);
    console.log(`🔧 [EnhancementLeague] Using ${useUTCOnly ? 'UTC-only' : 'timezone-aware'} filtering - this ensures matches scheduled for ${selectedDate} UTC appear on ${selectedDate} for all users globally`);

    // Debug: Check what leagues are available in processed fixtures
    const availableLeagues = new Set();
    processedFixtures.forEach(fixture => {
      if (fixture.league?.id) {
        availableLeagues.add(`${fixture.league.id}: ${fixture.league.name} (${fixture.league.country})`);
      }
    });
    console.log(`🔧 [EnhancementLeague] Available leagues in processed fixtures:`, Array.from(availableLeagues).slice(0, 10));

    const filtered = processedFixtures.filter((fixture) => {
      // Only include enhancement leagues
      const leagueId = fixture.league?.id;
      const isEnhancement = enhancementLeagueIds.includes(leagueId);
      
      if (isEnhancement) {
        console.log(`✅ [EnhancementLeague] Found enhancement league match:`, {
          leagueId,
          leagueName: fixture.league?.name,
          country: fixture.league?.country,
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name
        });
      }
      
      return isEnhancement;
    });

    console.log(`🔧 [EnhancementLeague] Filtered ${processedFixtures.length} to ${filtered.length} enhancement league fixtures`);

    return filtered;
  }, [processedFixtures]);

  // Group fixtures by country and league
  const fixturesByCountry = enhancementFixtures.reduce((acc: any, fixture: any) => {
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      return acc;
    }

    const league = fixture.league;
    if (!league.id || !league.name) {
      console.warn("Invalid league data:", league);
      return acc;
    }

    const country = league.country || "Unknown";
    const leagueId = league.id;

    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlagWithFallbackSync(country, league.flag),
        leagues: {},
        hasEnhancementLeague: true,
      };
    }

    // Find enhancement league info
    const enhancementLeague = ENHANCEMENT_LEAGUES.find(el => el.id === leagueId);

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: {
          ...league,
          logo: league.logo || "https://media.api-sports.io/football/leagues/1.png",
        },
        matches: [],
        isEnhancement: true,
        priority: enhancementLeague?.priority || 999,
      };
    }

    // Validate team data before adding
    if (
      fixture.teams.home &&
      fixture.teams.away &&
      fixture.teams.home.name &&
      fixture.teams.away.name
    ) {
      acc[country].leagues[leagueId].matches.push({
        ...fixture,
        teams: {
          home: {
            ...fixture.teams.home,
            logo: fixture.teams.home.logo || "/assets/fallback-logo.svg",
          },
          away: {
            ...fixture.teams.away,
            logo: fixture.teams.away.logo || "/assets/fallback-logo.svg",
          },
        },
      });
    }

    return acc;
  }, {});

  // Sort countries and leagues
  const sortedCountries = useMemo(() => {
    const countries = Object.values(fixturesByCountry);
    
    return countries.sort((a: any, b: any) => {
      // Sort by country name
      return a.country.localeCompare(b.country);
    });
  }, [fixturesByCountry]);

  // Apply filters
  const filteredCountries = sortedCountries.filter((countryData: any) => {
    if (liveFilterActive) {
      // Only show countries with live matches
      return Object.values(countryData.leagues).some((leagueData: any) => {
        return leagueData.matches.some((match: any) => {
          return ["LIVE", "LIV", "1H", "HT", "2H"].includes(match.fixture.status.short);
        });
      });
    }
    return true;
  });

  const finalCountries = showTop10 ? filteredCountries.slice(0, 10) : filteredCountries;

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

  // Format the time for display - always show in user's local timezone for user experience
  const formatMatchTime = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return "--:--";
      // Parse UTC time and display in user's local timezone
      const utcDate = parseISO(dateString);
      if (!isValid(utcDate)) return "--:--";
      return format(utcDate, "HH:mm");
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };

  // Show loading state
  if (isLoading && !fixtures?.length) {
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
                    <Skeleton className="h-4 w-24" />
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

  if (!enhancementFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No enhancement league matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Enhancement Leagues
      </CardHeader>

      {/* Create individual league cards */}
      {finalCountries.flatMap((countryData: any, countryIndex: number) =>
        Object.values(countryData.leagues)
          .sort((a: any, b: any) => {
            // Sort by priority
            return a.priority - b.priority;
          })
          .map((leagueData: any, leagueIndex: number) => {
            return (
              <Card
                key={`enhancement-${countryData.country}-${leagueData.league.id}`}
                className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
              >
                {/* League Header */}
                {!timeFilterActive && (
                  <CardContent className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
                    {/* League Star Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarMatch(leagueData.league.id);
                      }}
                      className="transition-colors"
                      title={`${starredMatches.has(leagueData.league.id) ? "Remove from" : "Add to"} favorites`}
                    >
                      <Star
                        className={`h-5 w-5 transition-all ${
                          starredMatches.has(leagueData.league.id)
                            ? "text-green-500 fill-green-500"
                            : "text-green-300"
                        }`}
                      />
                    </button>

                    <img
                      src={leagueData.league.logo || "/assets/fallback-logo.svg"}
                      alt={leagueData.league.name || "Unknown League"}
                      className="w-6 h-6 object-contain rounded-full"
                      style={{ backgroundColor: "transparent" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                      }}
                    />
                    <div className="flex flex-col flex-1">
                      <span
                        className="font-semibold text-gray-800"
                        style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "13.3px",
                        }}
                      >
                        {safeSubstring(leagueData.league.name, 0) || "Unknown League"}
                      </span>
                      <span
                        className="text-gray-600"
                        style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "13.3px",
                        }}
                      >
                        {leagueData.league.country || "Unknown Country"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <span
                        className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"
                        style={{ fontSize: "calc(0.75rem * 0.85)" }}
                      >
                        Enhancement
                      </span>
                    </div>
                  </CardContent>
                )}

                {/* Matches */}
                <div className="match-cards-wrapper">
                  {leagueData.matches
                    .slice(0, timeFilterActive && showTop10 ? 10 : undefined)
                    .sort((a: any, b: any) => {
                      const now = new Date();
                      const aDate = parseISO(a.fixture.date);
                      const bDate = parseISO(b.fixture.date);
                      const aStatus = a.fixture.status.short;
                      const bStatus = b.fixture.status.short;

                      if (!isValid(aDate) || !isValid(bDate)) {
                        return 0;
                      }

                      const aTime = aDate.getTime();
                      const bTime = bDate.getTime();
                      const nowTime = now.getTime();

                      // Live matches first
                      const aLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
                      const bLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

                      if (aLive && !bLive) return -1;
                      if (!aLive && bLive) return 1;

                      // Then by time proximity
                      const aDistance = Math.abs(aTime - nowTime);
                      const bDistance = Math.abs(bTime - nowTime);
                      return aDistance - bDistance;
                    })
                    .map((match: any) => (
                      <div
                        key={match.fixture.id}
                        className="match-card-container group"
                        onClick={() => onMatchCardClick?.(match)}
                        style={{
                          cursor: onMatchCardClick ? "pointer" : "default",
                        }}
                      >
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

                        {/* Match content container */}
                        <div className="match-three-grid-container">
                          {/* Top Grid: Match Status */}
                          <div className="match-status-top">
                            {(() => {
                              const status = match.fixture.status.short;
                              const elapsed = match.fixture.status.elapsed;

                              if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                                let displayText = "";
                                if (status === "HT") {
                                  displayText = "Halftime";
                                } else if (status === "P") {
                                  displayText = "Penalties";
                                } else if (status === "ET") {
                                  displayText = elapsed ? `${elapsed}' ET` : "Extra Time";
                                } else if (status === "BT") {
                                  displayText = "Break Time";
                                } else if (status === "INT") {
                                  displayText = "Interrupted";
                                } else {
                                  displayText = elapsed ? `${elapsed}'` : "LIVE";
                                }

                                return (
                                  <div className="match-status-label status-live">
                                    {displayText}
                                  </div>
                                );
                              }

                              if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                                return (
                                  <div className="match-status-label status-ended">
                                    {status === "FT" ? "Ended" : status}
                                  </div>
                                );
                              }

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

                          {/* Middle Grid: Main match content */}
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
                              <MyWorldTeamLogo
                                teamName={match.teams.home.name}
                                teamLogo={
                                  match.teams.home.id
                                    ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                    : "/assets/fallback-logo.svg"
                                }
                                alt={match.teams.home.name}
                                size="34px"
                                className="popular-leagues-size"
                                leagueContext={{
                                  name: leagueData.league.name,
                                  country: leagueData.league.country,
                                }}
                              />
                            </div>

                            {/* Score/Time Center */}
                            <div className="match-score-container">
                              {(() => {
                                const status = match.fixture.status.short;
                                const fixtureDate = parseISO(match.fixture.date);

                                if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                                  return (
                                    <div className="match-score-display">
                                      <span className="score-number">{match.goals.home ?? 0}</span>
                                      <span className="score-separator">-</span>
                                      <span className="score-number">{match.goals.away ?? 0}</span>
                                    </div>
                                  );
                                }

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
                                      <div className="match-score-display">
                                        <span className="score-number">{homeScore}</span>
                                        <span className="score-separator">-</span>
                                        <span className="score-number">{awayScore}</span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                                        {format(fixtureDate, "HH:mm")}
                                      </div>
                                    );
                                  }
                                }

                                return (
                                  <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                                    {status === "TBD" ? "TBD" : format(fixtureDate, "HH:mm")}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Away team logo */}
                            <div className="away-team-logo-container">
                              <MyWorldTeamLogo
                                teamName={match.teams.away.name}
                                teamLogo={
                                  match.teams.away.id
                                    ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                    : "/assets/fallback-logo.svg"
                                }
                                alt={match.teams.away.name}
                                size="34px"
                                className="popular-leagues-size"
                                leagueContext={{
                                  name: leagueData.league.name,
                                  country: leagueData.league.country,
                                }}
                              />
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

                          {/* Bottom Grid: Penalty Result Status */}
                          <div className="match-penalty-bottom">
                            {(() => {
                              const status = match.fixture.status.short;
                              const isPenaltyMatch = status === "PEN";
                              const penaltyHome = match.score?.penalty?.home;
                              const penaltyAway = match.score?.penalty?.away;
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
                                    <span className="penalty-winner">{winnerText}</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            );
          }),
      )}
    </>
  );
};

export default EnhancementLeague;
