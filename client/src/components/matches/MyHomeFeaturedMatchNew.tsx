Modified MyHomeFeaturedMatchNew.tsx to require both teams to be popular for friendlies to be included.
```

```tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import TeamLogo from "./TeamLogo";
import LazyImage from "../common/LazyImage";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import {
  getTeamColor,
  getEnhancedHomeTeamGradient,
} from "@/lib/colorExtractor";
import { motion, AnimatePresence } from "framer-motion";
import FixedScoreboard from "./FixedScoreboard";

// Import popular teams data from the same source as PopularTeamsList
const POPULAR_TEAMS_DATA = [
  { id: 33, name: 'Manchester United', country: 'England' },
  { id: 40, name: 'Liverpool', country: 'England' },
  { id: 50, name: 'Manchester City', country: 'England' },
  { id: 42, name: 'Arsenal', country: 'England' },
  { id: 49, name: 'Chelsea', country: 'England' },
  { id: 541, name: 'Real Madrid', country: 'Spain' },
  { id: 529, name: 'FC Barcelona', country: 'Spain' },
  { id: 47, name: 'Tottenham', country: 'England' },
  { id: 157, name: 'Bayern Munich', country: 'Germany' },
  { id: 489, name: 'AC Milan', country: 'Italy' },
  { id: 492, name: 'Inter', country: 'Italy' },
  { id: 496, name: 'Juventus', country: 'Italy' },
  { id: 165, name: 'Borussia Dortmund', country: 'Germany' },
  { id: 173, name: 'RB Leipzig', country: 'Germany' },
  { id: 168, name: 'Bayer Leverkusen', country: 'Germany' },
  { id: 81, name: 'PSG', country: 'France' },
  { id: 85, name: 'Lyon', country: 'France' },
  { id: 212, name: 'Marseille', country: 'France' },
  { id: 548, name: 'Atletico Madrid', country: 'Spain' },
  { id: 530, name: 'Sevilla', country: 'Spain' },
  { id: 532, name: 'Valencia', country: 'Spain' },
  { id: 533, name: 'Villarreal', country: 'Spain' },
  { id: 610, name: 'Ajax', country: 'Netherlands' },
  { id: 194, name: 'PSV', country: 'Netherlands' },
  { id: 120, name: 'Feyenoord', country: 'Netherlands' },
  { id: 211, name: 'Porto', country: 'Portugal' },
  { id: 212, name: 'Benfica', country: 'Portugal' },
  { id: 228, name: 'Sporting CP', country: 'Portugal' },
  // Additional popular teams from various leagues
  { id: 502, name: 'Napoli', country: 'Italy' },
  { id: 500, name: 'AS Roma', country: 'Italy' },
  { id: 505, name: 'Lazio', country: 'Italy' },
  { id: 192, name: 'Union Berlin', country: 'Germany' },
  { id: 169, name: 'Eintracht Frankfurt', country: 'Germany' },
  // Popular reserve/academy teams
  { id: 1859, name: 'Bayern München II', country: 'Germany' },
  { id: 1860, name: 'Borussia Dortmund II', country: 'Germany' },
  { id: 8572, name: 'Jong PSV', country: 'Netherlands' },
  { id: 8564, name: 'Jong Ajax', country: 'Netherlands' }
];

const POPULAR_TEAM_IDS = POPULAR_TEAMS_DATA.map(team => team.id);
const POPULAR_TEAM_NAMES = POPULAR_TEAMS_DATA.map(team => team.name.toLowerCase());
interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

// Popular leagues from PopularLeaguesList.tsx
const POPULAR_LEAGUES = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 61, name: "Ligue 1", country: "France" },
  { id: 2, name: "UEFA Champions League", country: "Europe" },
  { id: 3, name: "UEFA Europa League", country: "Europe" },
  { id: 848, name: "UEFA Conference League", country: "Europe" },
  { id: 5, name: "UEFA Nations League", country: "Europe" },
  { id: 1, name: "World Cup", country: "World" },
  { id: 4, name: "Euro Championship", country: "World" },
  { id: 15, name: "FIFA Club World Cup", country: "World" },
  { id: 38, name: "UEFA U21 Championship", country: "World" },
  { id: 9, name: "Copa America", country: "World" },
  { id: 16, name: "CONCACAF Gold Cup", country: "World" },
  { id: 667, name: "Friendlies Clubs", country: "World" },
];

// Define featured leagues
const FEATURED_MATCH_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 2, 3, 848, 5, 1, 4, 15, 38, 9, 16,
];
const PRIORITY_LEAGUE_IDS = [15, 38, 22]; // FIFA Club World Cup, UEFA U21 Championship, CONCACAF Gold Cup

interface FeaturedMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  venue?: {
    id?: number;
    name?: string;
    city?: string;
  };
}

interface DayMatches {
  date: string;
  label: string;
  matches: FeaturedMatch[];
}

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  maxMatches = 15,
}) => {
  // Add CSS for truePulse animation
  const truePulseStyle = `
    @keyframes truePulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;

  // Inject styles if not already present
  React.useEffect(() => {
    const styleId = 'truePulse-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = truePulseStyle;
      document.head.appendChild(style);
    }
  }, []);
  const [, navigate] = useLocation();
  const [featuredMatches, setFeaturedMatches] = useState<DayMatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<string>("Loading...");
  const [roundsCache, setRoundsCache] = useState<Record<string, string[]>>({});

  const fetchRoundsForLeague = useCallback(async (leagueId: number, season: number) => {
    const cacheKey = `${leagueId}-${season}`;
    if (roundsCache[cacheKey]) {
      return roundsCache[cacheKey];
    }

    try {
      const response = await apiRequest("GET", `/api/fixtures/rounds?league=${leagueId}&season=${season}`);
      const rounds = await response.json();

      setRoundsCache(prev => ({
        ...prev,
        [cacheKey]: rounds
      }));

      return rounds;
    } catch (error) {
      console.warn(`Failed to fetch rounds for league ${leagueId}:`, error);
      return [];
    }
  }, [roundsCache]);

  const fetchFeaturedMatches = useCallback(
    async (forceRefresh = false) => {
      try {
        // Only show loading on initial load or force refresh
        if (forceRefresh || featuredMatches.length === 0) {
          setIsLoading(true);
        }

        // Get dates for today and the next 4 days
        const today = new Date();
        const dates = [
          { date: format(today, "yyyy-MM-dd"), label: "Today" },
          { date: format(addDays(today, 1), "yyyy-MM-dd"), label: "Tomorrow" },
          {
            date: format(addDays(today, 2), "yyyy-MM-dd"),
            label: "Day After Tomorrow",
          },
          {
            date: format(addDays(today, 3), "yyyy-MM-dd"),
            label: format(addDays(today, 3), "EEEE"),
          },
          {
            date: format(addDays(today, 4), "yyyy-MM-dd"),
            label: format(addDays(today, 4), "EEEE"),
          },
        ];

        // Use priority leagues from our clean list
        const priorityLeagueIds = PRIORITY_LEAGUE_IDS;
        const allFixtures: FeaturedMatch[] = [];

        console.log(
          "🔍 [MyHomeFeaturedMatchNew] Starting fetch with priority leagues:",
          priorityLeagueIds,
        );
        console.log(
          "🔍 [MyHomeFeaturedMatchNew] All featured league IDs:",
          FEATURED_MATCH_LEAGUE_IDS,
        );

        // Helper function to determine if match is live
        const isLiveMatch = (status: string) => {
          return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            status,
          );
        };

        // Helper function to determine if match is ended
        const isEndedMatch = (status: string) => {
          return [
            "FT",
            "AET",
            "PEN",
            "AWD",
            "WO",
            "ABD",
            "CANC",
            "SUSP",
          ].includes(status);
        };

        // Helper function to determine if match is upcoming
        const isUpcomingMatch = (status: string) => {
          return ["NS", "TBD", "PST"].includes(status);
        };

        // Simple validation - only check for valid team names
        const isValidMatch = (fixture: any) => {
          return !!(fixture?.teams?.home?.name && fixture?.teams?.away?.name);
        };

        // Fetch live matches from API for real-time updates
        let liveFixtures: FeaturedMatch[] = [];
        try {
          if (forceRefresh) {
            console.log(
              "🔴 [MyHomeFeaturedMatchNew] Fetching live matches from dedicated endpoint",
            );
            const liveResponse = await apiRequest(
              "GET",
              "/api/featured-match/live?skipFilter=true",
            );
            const liveData = await liveResponse.json();

            if (Array.isArray(liveData)) {
              console.log(
                "🔍 [MyHomeFeaturedMatchNew] Processing live fixtures:",
                liveData.length,
              );

              // First filter by featured leagues, then by valid teams
              const featuredLiveFixtures = liveData.filter((fixture) =>
                FEATURED_MATCH_LEAGUE_IDS.includes(fixture.league?.id),
              );

              console.log(
                "🔍 [MyHomeFeaturedMatchNew] Featured live fixtures:",
                featuredLiveFixtures.length,
              );

              liveFixtures = featuredLiveFixtures
                .filter((fixture: any) => {
                  const isValid = isValidMatch(fixture);
                  if (!isValid) {
                    console.log(
                      "❌ [MyHomeFeaturedMatchNew] Filtered out invalid fixture:",
                      {
                        home: fixture.teams?.home?.name,
                        away: fixture.teams?.away?.name,
                        league: fixture.league?.name,
                      },
                    );
                  } else {
                    console.log(
                      "✅ [MyHomeFeaturedMatchNew] Valid featured live fixture:",
                      {
                        home: fixture.teams?.home?.name,
                        away: fixture.teams?.away?.name,
                        league: fixture.league?.name,
                        leagueId: fixture.league?.id,
                      },
                    );
                  }
                  return isValid;
                })
                .map((fixture: any) => ({
                  fixture: {
                    id: fixture.fixture.id,
                    date: fixture.fixture.date,
                    status: fixture.fixture.status,
                  },
                  league: {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    country: fixture.league.country,
                    logo: fixture.league.logo,
                  },
                  teams: {
                    home: {
                      id: fixture.teams.home.id,
                      name: fixture.teams.home.name,
                      logo: fixture.teams.home.logo,
                    },
                    away: {
                      id: fixture.teams.away.id,
                      name: fixture.teams.away.name,
                      logo: fixture.teams.away.logo,
                    },
                  },
                  goals: {
                    home: fixture.goals?.home ?? null,
                    away: fixture.goals?.away ?? null,
                  },
                }));
            }
            console.log(
              `✅ [MyHomeFeaturedMatchNew] Found ${liveFixtures.length} live matches (including all live matches regardless of league)`,
            );
          }
        } catch (error) {
          console.error(
            "❌ [MyHomeFeaturedMatchNew] Error fetching live matches:",
            error,
          );
        }

        allFixtures.push(...liveFixtures);

        // Fetch non-live matches from cached data only on initial load or force refresh
        if (forceRefresh || allFixtures.length === 0) {
          // Fetch non-live matches from cached data (priority leagues)
          for (const leagueId of priorityLeagueIds) {
            try {
              console.log(
                `🔍 [MyHomeFeaturedMatchNew] Fetching cached data for league ${leagueId}`,
              );

              const fixturesResponse = await apiRequest(
                "GET",
                `/api/featured-match/leagues/${leagueId}/fixtures?skipFilter=true`,
              );
              const fixturesData = await fixturesResponse.json();

              if (Array.isArray(fixturesData)) {
                const cachedFixtures = fixturesData
                  .filter((fixture: any) => {
                    // Must have valid teams and NOT be live (since we already fetched live matches)
                    const hasValidTeams = isValidMatch(fixture);
                    const isNotLive = !isLiveMatch(
                      fixture.fixture.status.short,
                    );

                    // Exclude women's competitions
                    const leagueName = fixture.league?.name?.toLowerCase() || "";
                    const isWomensCompetition = leagueName.includes("women") || 
                      leagueName.includes("femenina") || 
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    const shouldInclude = hasValidTeams && isNotLive && !isWomensCompetition;

                    if (shouldInclude) {
                      console.log(
                        `✅ [MyHomeFeaturedMatchNew] Including priority league ${leagueId} fixture:`,
                        {
                          home: fixture.teams?.home?.name,
                          away: fixture.teams?.away?.name,
                          league: fixture.league?.name,
                          leagueId: fixture.league?.id,
                          status: fixture.fixture.status.short,
                        },
                      );
                    } else if (isWomensCompetition) {
                      console.log(
                        `❌ [MyHomeFeaturedMatchNew] Excluding women's competition:`,
                        {
                          league: fixture.league?.name,
                          leagueId: fixture.league?.id,
                        },
                      );
                    }

                    return shouldInclude;
                  })
                  .map((fixture: any) => ({
                    fixture: {
                      id: fixture.fixture.id,
                      date: fixture.fixture.date,
                      status: fixture.fixture.status,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                    },
                    teams: {
                      home: {
                        id: fixture.teams.home.id,
                        name: fixture.teams.home.name,
                        logo: fixture.teams.home.logo,
                      },
                      away: {
                        id: fixture.teams.away.id,
                        name: fixture.teams.away.name,
                        logo: fixture.teams.away.logo,
                      },
                    },
                    goals: {
                      home: fixture.goals?.home ?? null,
                      away: fixture.goals?.away ?? null,
                    },
                  }));

                allFixtures.push(...cachedFixtures);
              }
            } catch (leagueError) {
              console.warn(
                `Failed to fetch cached data for league ${leagueId}:`,
                leagueError,
              );
            }
          }

          // Fetch popular team friendlies from Friendlies Clubs league (667)
          try {
            console.log(
              `🔍 [MyHomeFeaturedMatchNew] Fetching Friendlies Clubs fixtures for popular teams`,
            );

            const friendliesResponse = await apiRequest(
              "GET",
              `/api/featured-match/leagues/667/fixtures?skipFilter=true`,
            );
            const friendliesData = await friendliesResponse.json();

            if (Array.isArray(friendliesData)) {
              const popularFriendlies = friendliesData
                .filter((fixture: any) => {
                  // Must have valid teams and NOT be live
                  const hasValidTeams = isValidMatch(fixture);
                  const isNotLive = !isLiveMatch(
                    fixture.fixture.status.short,
                  );

                  if (!hasValidTeams || !isNotLive) {
                    return false;
                  }

                  // Check if it involves popular teams (require BOTH teams to be popular)
                      const homeTeamId = fixture.teams?.home?.id;
                      const awayTeamId = fixture.teams?.away?.id;
                      const homeTeam = fixture.teams?.home?.name?.toLowerCase() || "";
                      const awayTeam = fixture.teams?.away?.name?.toLowerCase() || "";

                      // Check if both teams are popular
                      let homeIsPopular = false;
                      let awayIsPopular = false;

                      // First check by team ID (most accurate)
                      homeIsPopular = POPULAR_TEAM_IDS.includes(homeTeamId);
                      awayIsPopular = POPULAR_TEAM_IDS.includes(awayTeamId);

                      // Fallback to name matching if ID check didn't find popular teams
                      if (!homeIsPopular || !awayIsPopular) {
                        if (!homeIsPopular) {
                          homeIsPopular = POPULAR_TEAM_NAMES.some(popularTeam => 
                            homeTeam.includes(popularTeam)
                          );
                        }
                        if (!awayIsPopular) {
                          awayIsPopular = POPULAR_TEAM_NAMES.some(popularTeam => 
                            awayTeam.includes(popularTeam)
                          );
                        }
                      }

                      // Enhanced keyword-based matching for major clubs
                      if (!homeIsPopular || !awayIsPopular) {
                        const popularTeamKeywords = [
                          "real madrid", "barcelona", "manchester city", "manchester united", "manchester",
                          "bayern munich", "bayern", "juventus", "psg", "paris saint-germain", "paris saint germain",
                          "liverpool", "arsenal", "chelsea", "atletico madrid", "atletico", "tottenham",
                          "ac milan", "inter milan", "inter", "napoli", "roma", "as roma", 
                          "borussia dortmund", "borussia", "dortmund", "rb leipzig", "leipzig", 
                          "bayer leverkusen", "leverkusen", "lyon", "olympique lyonnais", "marseille",
                          "olympique marseille", "monaco", "as monaco", "sevilla", "valencia", 
                          "villarreal", "ajax", "feyenoord", "psv eindhoven", "psv", "porto", 
                          "fc porto", "benfica", "sl benfica", "sporting cp", "sporting lisbon", "sporting"
                        ];

                        if (!homeIsPopular) {
                          homeIsPopular = popularTeamKeywords.some(keyword => 
                            homeTeam.includes(keyword)
                          );
                        }
                        if (!awayIsPopular) {
                          awayIsPopular = popularTeamKeywords.some(keyword => 
                            awayTeam.includes(keyword)
                          );
                        }
                      }

                      // Only include friendlies if BOTH teams are popular
                      if (homeIsPopular && awayIsPopular) {
                        console.log(`🎯 [MyHomeFeaturedMatchNew] Popular club friendly found (both teams popular): ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                        return true;
                      }

                      console.log(`❌ [MyHomeFeaturedMatchNew] Club friendly excluded (not both teams popular): ${fixture.teams.home.name} vs ${fixture.teams.away.name} - Home: ${homeIsPopular}, Away: ${awayIsPopular}`);
                      return false;
                })
                .map((fixture: any) => ({
                  fixture: {
                    id: fixture.fixture.id,
                    date: fixture.fixture.date,
                    status: fixture.fixture.status,
                  },
                  league: {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    country: fixture.league.country,
                    logo: fixture.league.logo,
                  },
                  teams: {
                    home: {
                      id: fixture.teams.home.id,
                      name: fixture.teams.home.name,
                      logo: fixture.teams.home.logo,
                    },
                    away: {
                      id: fixture.teams.away.id,
                      name: fixture.teams.away.name,
                      logo: fixture.teams.away.logo,
                    },
                  },
                  goals: {
                    home: fixture.goals?.home ?? null,
                    away: fixture.goals?.away ?? null,
                  },
                }));

              console.log(`🎯 [MyHomeFeaturedMatchNew] Found ${popularFriendlies.length} popular team friendlies`);
              allFixtures.push(...popularFriendlies);
            }
          } catch (friendliesError) {
            console.warn(
              `Failed to fetch Friendlies Clubs data:`,
              friendliesError,
            );
          }

          // Fetch non-live matches from cached date-based data
          for (const dateInfo of dates) {
            try {
              console.log(
                `🔍 [MyHomeFeaturedMatchNew] Fetching cached data for ${dateInfo.label}: ${dateInfo.date}`,
              );

              const response = await apiRequest(
                "GET",
                `/api/featured-match/date/${dateInfo.date}?all=true&skipFilter=true`,
              );
              const fixtures = await response.json();

              if (fixtures?.length) {
                const cachedFixtures = fixtures
                  .filter((fixture: any) => {
                    // Must have valid teams, be from popular leagues, not priority leagues, and NOT be live
                    const hasValidTeams =
                      fixture.teams?.home?.name && fixture.teams?.away?.name;

                    const leagueName = fixture.league?.name?.toLowerCase() || "";
                    const country = fixture.league?.country?.toLowerCase() || "";

                    // Exclude women's competitions
                    const isWomensCompetition = leagueName.includes("women") || 
                      leagueName.includes("femenina") || 
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    // Check if it's a popular league or from a popular country
                    const isPopularLeague = POPULAR_LEAGUES.some(
                      (league) => league.id === fixture.league?.id,
                    );
                    const isFromPopularCountry = POPULAR_LEAGUES.some(
                      (league) => league.country.toLowerCase() === country,
                    );
                    const isPriorityLeague = priorityLeagueIds.includes(
                      fixture.league?.id,
                    );
                    const isNotLive = !isLiveMatch(
                      fixture.fixture.status.short,
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

                    // Check if it's a club friendly with popular teams using the imported popular teams list
                        const isPopularClubFriendly = () => {
                          if (leagueName.includes("club friendlies") || 
                              leagueName.includes("friendlies clubs") ||
                              fixture.league?.id === 667 ||
                              (leagueName.includes("friendlies") && !leagueName.includes("international") && !leagueName.includes("women"))) {
                            const homeTeamId = fixture.teams?.home?.id;
                            const awayTeamId = fixture.teams?.away?.id;
                            const homeTeam = fixture.teams?.home?.name?.toLowerCase() || "";
                            const awayTeam = fixture.teams?.away?.name?.toLowerCase() || "";

                            // Check if both teams are popular (require BOTH teams to be popular for friendlies)
                            let homeIsPopular = false;
                            let awayIsPopular = false;

                            // First check by team ID (most accurate)
                            if (homeTeamId && awayTeamId) {
                              homeIsPopular = POPULAR_TEAM_IDS.includes(homeTeamId);
                              awayIsPopular = POPULAR_TEAM_IDS.includes(awayTeamId);
                            }

                            // Fallback to name matching if ID check didn't find popular teams
                            if (!homeIsPopular || !awayIsPopular) {
                              if (!homeIsPopular) {
                                homeIsPopular = POPULAR_TEAM_NAMES.some(popularTeam => 
                                  homeTeam.includes(popularTeam)
                                );
                              }
                              if (!awayIsPopular) {
                                awayIsPopular = POPULAR_TEAM_NAMES.some(popularTeam => 
                                  awayTeam.includes(popularTeam)
                                );
                              }
                            }

                            // Enhanced keyword-based matching for team variations including full names
                            if (!homeIsPopular || !awayIsPopular) {
                              const popularTeamKeywords = [
                                "real madrid", "barcelona", "manchester city", "manchester united", "manchester",
                                "bayern munich", "bayern", "juventus", "psg", "paris saint-germain", "paris saint germain",
                                "liverpool", "arsenal", "chelsea", "atletico madrid", "atletico", "tottenham",
                                "ac milan", "inter milan", "inter", "napoli", "roma", "as roma", 
                                "borussia dortmund", "borussia", "dortmund", "rb leipzig", "leipzig", 
                                "bayer leverkusen", "leverkusen", "lyon", "olympique lyonnais", "marseille",
                                "olympique marseille", "monaco", "as monaco", "sevilla", "valencia", 
                                "villarreal", "ajax", "feyenoord", "psv eindhoven", "psv", "porto", 
                                "fc porto", "benfica", "sl benfica", "sporting cp", "sporting lisbon", "sporting",
                                "fenerbahce", "galatasaray", "besiktas", "trabzonspor", "millwall", "southampton",
                                "elche", "valencia", "newcastle", "west ham", "brighton", "brentford"
                              ];

                              if (!homeIsPopular) {
                                homeIsPopular = popularTeamKeywords.some(keyword => 
                                  homeTeam.includes(keyword)
                                );
                              }
                              if (!awayIsPopular) {
                                awayIsPopular = popularTeamKeywords.some(keyword => 
                                  awayTeam.includes(keyword)
                                );
                              }
                            }

                            // Only include friendlies if BOTH teams are popular
                            if (homeIsPopular && awayIsPopular) {
                              console.log(`✅ [MyHomeFeaturedMatchNew] Popular club friendly found (both teams popular): ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`);
                              return true;
                            }

                            console.log(`❌ [MyHomeFeaturedMatchNew] Club friendly excluded (not both teams popular): ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name}) - Home: ${homeIsPopular}, Away: ${awayIsPopular}`);
                            return false;
                          }
                          return false;
                        };

                    return (
                      hasValidTeams &&
                      (isPopularLeague ||
                      isFromPopularCountry ||
                      isInternationalCompetition ||
                      isPopularClubFriendly()) &&
                      !isPriorityLeague &&
                      isNotLive &&
                      !isWomensCompetition
                    );
                  })
                  .map((fixture: any) => ({
                    fixture: {
                      id: fixture.fixture.id,
                      date: fixture.fixture.date,
                      status: fixture.fixture.status,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                    },
                    teams: {
                      home: {
                        id: fixture.teams.home.id,
                        name: fixture.teams.home.name,
                        logo: fixture.teams.home.logo,
                      },
                      away: {
                        id: fixture.teams.away.id,
                        name: fixture.teams.away.name,
                        logo: fixture.teams.away.logo,
                      },
                    },
                    goals: {
                      home: fixture.goals?.home ?? null,
                      away: fixture.goals?.away ?? null,
                    },
                  }));

                allFixtures.push(...cachedFixtures);
              }
            } catch (error) {
              console.error(
                `❌ [MyHomeFeaturedMatchNew] Error fetching cached data for ${dateInfo.label}:`,
                error,
              );
            }
          }

          // If we still don't have enough fixtures, expand search to all popular leagues
          if (allFixtures.length < 3) {
            console.log(
              `🔄 [MyHomeFeaturedMatchNew] Only ${allFixtures.length} fixtures found, expanding to all popular leagues`,
            );

            for (const dateInfo of dates) {
              try {
                const response = await apiRequest(
                  "GET",
                  `/api/featured-match/date/${dateInfo.date}?all=true&skipFilter=true`,
                );
                const fixtures = await response.json();

                if (fixtures?.length) {
                  const expandedFixtures = fixtures
                    .filter((fixture: any) => {
                      const hasValidTeams =
                        fixture.teams?.home?.name && fixture.teams?.away?.name;
                      const isNotLive = !isLiveMatch(
                        fixture.fixture.status.short,
                      );
                      const isNotDuplicate = !allFixtures.some(
                        (existing) =>
                          existing.fixture.id === fixture.fixture.id,
                      );

                      // Exclude women's```text
competitions
                      const leagueName = fixture.league?.name?.toLowerCase() || "";
                      const isWomensCompetition = leagueName.includes("women") || 
                        leagueName.includes("femenina") || 
                        leagueName.includes("feminine") ||
                        leagueName.includes("feminin");

                      return hasValidTeams && isNotLive && isNotDuplicate && !isWomensCompetition;
                    })
                    .slice(0, 5) // Limit to prevent overwhelming
                    .map((fixture: any) => ({
                      fixture: {
                        id: fixture.fixture.id,
                        date: fixture.fixture.date,
                        status: fixture.fixture.status,
                      },
                      league: {
                        id: fixture.league.id,
                        name: fixture.league.name,
                        country: fixture.league.country,
                        logo: fixture.league.logo,
                      },
                      teams: {
                        home: {
                          id: fixture.teams.home.id,
                          name: fixture.teams.home.name,
                          logo: fixture.teams.home.logo,
                        },
                        away: {
                          id: fixture.teams.away.id,
                          name: fixture.teams.away.name,
                          logo: fixture.teams.away.logo,
                        },
                      },
                      goals: {
                        home: fixture.goals?.home ?? null,
                        away: fixture.goals?.away ?? null,
                      },
                    }));

                  allFixtures.push(...expandedFixtures);
                }
              } catch (error) {
                console.error(
                  `❌ [MyHomeFeaturedMatchNew] Error in expanded search for ${dateInfo.label}:`,
                  error,
                );
              }
            }
          }
        }

        // Remove duplicates based on fixture ID
        const uniqueFixtures = allFixtures.filter(
          (fixture, index, self) =>
            index ===
            self.findIndex((f) => f.fixture.id === fixture.fixture.id),
        );

        console.log(
          `📋 [MyHomeFeaturedMatchNew] Total unique fixtures found:`,
          uniqueFixtures.length,
        );
        console.log(
          `📋 [MyHomeFeaturedMatchNew] Fixture details:`,
          uniqueFixtures.map((f) => ({
            id: f.fixture.id,
            teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
            league: f.league.name,
            status: f.fixture.status.short,
            date: f.fixture.date,
          })),
        );

        // Group fixtures by date
        const allMatches: DayMatches[] = [];
        for (const dateInfo of dates) {
          const fixturesForDay = uniqueFixtures
            .filter((fixture) => {
              const matchDate = new Date(fixture.fixture.date);
              const year = matchDate.getFullYear();
              const month = String(matchDate.getMonth() + 1).padStart(2, "0");
              const day = String(matchDate.getDate()).padStart(2, "0");
              const matchDateString = `${year}-${month}-${day}`;
              return matchDateString === dateInfo.date;
            })
            .sort((a: FeaturedMatch, b: FeaturedMatch) => {
              // Special priority for specific FIFA Club World Cup match (Inter vs River Plate)
              const aIsSpecialMatch =
                a.league.id === 15 &&
                ((a.teams.home.name === "Inter" &&
                  a.teams.away.name === "River Plate") ||
                  (a.teams.home.name === "River Plate" &&
                    a.teams.away.name === "Inter"));
              const bIsSpecialMatch =
                b.league.id === 15 &&
                ((b.teams.home.name === "Inter" &&
                  b.teams.away.name === "River Plate") ||
                  (b.teams.home.name === "River Plate" &&
                    b.teams.away.name === "Inter"));

              // Special match always comes first
              if (aIsSpecialMatch && !bIsSpecialMatch) return -1;
              if (!aIsSpecialMatch && bIsSpecialMatch) return 1;

              // Priority sort: live matches first, then by league priority, then by popular team friendlies, then by time
              const aStatus = a.fixture.status.short;
              const bStatus = b.fixture.status.short;

              const aLive = isLiveMatch(aStatus);
              const bLive = isLiveMatch(bStatus);

              // Live matches always come first (after special match)
              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              // Priority leagues first
              const aPriority = priorityLeagueIds.indexOf(a.league.id);
              const bPriority = priorityLeagueIds.indexOf(b.league.id);

              if (aPriority !== -1 && bPriority === -1) return -1;
              if (aPriority === -1 && bPriority !== -1) return 1;
              if (aPriority !== -1 && bPriority !== -1)
                return aPriority - bPriority;

              // Popular team friendlies get priority over regular matches
              const aLeagueName = a.league.name?.toLowerCase() || "";
              const bLeagueName = b.league.name?.toLowerCase() || "";

              const aIsPopularFriendly = (aLeagueName.includes("friendlies") || aLeagueName.includes("friendlies clubs") || a.league.id === 667) && 
                (POPULAR_TEAM_IDS.includes(a.teams.home.id) || POPULAR_TEAM_IDS.includes(a.teams.away.id));
              const bIsPopularFriendly = (bLeagueName.includes("friendlies") || bLeagueName.includes("friendlies clubs") || b.league.id === 667) && 
                (POPULAR_TEAM_IDS.includes(b.teams.home.id) || POPULAR_TEAM_IDS.includes(b.teams.away.id));

              if (aIsPopularFriendly && !bIsPopularFriendly) return -1;
              if (!aIsPopularFriendly && bIsPopularFriendly) return 1;

              // Calculate popular team score for additional sorting within friendlies
              const getPopularTeamScore = (match: FeaturedMatch) => {
                let score = 0;
                if (POPULAR_TEAM_IDS.includes(match.teams.home.id)) score += 1;
                if (POPULAR_TEAM_IDS.includes(match.teams.away.id)) score += 1;
                return score;
              };

              // If both are popular friendlies, prioritize by number of popular teams
              if (aIsPopularFriendly && bIsPopularFriendly) {
                const aScore = getPopularTeamScore(a);
                const bScore = getPopularTeamScore(b);
                if (aScore !== bScore) return bScore - aScore; // Higher score first
              }

              // Finally by time
              return (
                new Date(a.fixture.date).getTime() -
                new Date(b.fixture.date).getTime()
              );
            })
            .slice(0, Math.max(5, Math.floor(maxMatches / dates.length)));

          console.log(
            `✅ [MyHomeFeaturedMatchNew] Found ${fixturesForDay.length} featured matches for ${dateInfo.label}`,
          );

          allMatches.push({
            date: dateInfo.date,
            label: dateInfo.label,
            matches: fixturesForDay,
          });
        }

        // Only update state if data has actually changed
        setFeaturedMatches((prevMatches) => {
          const newMatchesString = JSON.stringify(allMatches);
          const prevMatchesString = JSON.stringify(prevMatches);

          if (newMatchesString !== prevMatchesString) {
            return allMatches;
          }
          return prevMatches;
        });
      } catch (error) {
        console.error("❌ [MyHomeFeaturedMatchNew] Error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [maxMatches],
  );

  useEffect(() => {
    // Initial fetch with force refresh
    fetchFeaturedMatches(true);
  }, []); // Only run once on mount

  // Separate effect for live match refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      const hasLiveMatches = featuredMatches.some((dayData) =>
        dayData.matches.some((match) =>
          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            match.fixture.status.short,
          ),
        ),
      );

      if (hasLiveMatches) {
        console.log(
          "🔄 [MyHomeFeaturedMatchNew] Live matches detected, refreshing data",
        );
        fetchFeaturedMatches(false); // Background refresh without loading state
      } else {
        console.log(
          "⏸️ [MyHomeFeaturedMatchNew] No live matches, skipping refresh",
        );
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [featuredMatches]); // Only depend on featuredMatches for live match detection

  const formatMatchTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "--:--";
    }
  };

  const getStatusDisplay = (match: FeaturedMatch) => {
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (status === "NS") {
      return {
        text: formatMatchTime(match.fixture.date),
        color: "bg-blue-500",
        isLive: false,
        isUpcoming: true,
      };
    }

    if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(status)) {
      let displayText = status;

      if (status === "HT") {
        displayText = "Half Time";
      } else if (status === "1H" || status === "2H" || status === "LIVE") {
        displayText = elapsed ? `${elapsed}'` : "LIVE";
      } else if (status === "ET") {
        displayText = elapsed ? `${elapsed}' ET` : "Extra Time";
      } else if (status === "P") {
        displayText = "Penalties";
      }

      return {
        text: displayText,
        color: "bg-red-500 animate-pulse",
        isLive: true,
        isUpcoming: false,
      };
    }

    if (status === "FT") {
      return {
        text: "Full Time",
        color: "bg-gray-500",
        isLive: false,
        isUpcoming: false,
      };
    }

    if (status === "PST") {
      return {
        text: "Postponed",
        color: "bg-yellow-500",
        isLive: false,
        isUpcoming: false,
      };
    }

    if (status === "CANC") {
      return {
        text: "Cancelled",
        color: "bg-red-600",
        isLive: false,
        isUpcoming: false,
      };
    }

    return {
      text: status,
      color: "bg-gray-400",
      isLive: false,
      isUpcoming: false,
    };
  };

  // Memoize expensive calculations
  const allMatches = useMemo(() => {
    return featuredMatches.reduce((acc, dayData) => {
      return [...acc, ...dayData.matches];
    }, [] as FeaturedMatch[]);
  }, [featuredMatches]);

  const currentMatch = useMemo(() => {
    return allMatches[currentMatchIndex];
  }, [allMatches, currentMatchIndex]);

  // Fetch rounds data for current match league
  useEffect(() => {
    if (currentMatch && !roundsCache[`${currentMatch.league.id}-2025`]) {
      fetchRoundsForLeague(currentMatch.league.id, 2025);
    }
  }, [currentMatch, fetchRoundsForLeague, roundsCache]);

  const handlePrevious = useCallback(() => {
    if (allMatches.length > 0) {
      setCurrentMatchIndex((prev) =>
        prev === 0 ? allMatches.length - 1 : prev - 1,
      );
    }
  }, [allMatches.length]);

  const handleNext = useCallback(() => {
    if (allMatches.length > 0) {
      setCurrentMatchIndex((prev) =>
        prev === allMatches.length - 1 ? 0 : prev + 1,
      );
    }
  }, [allMatches.length]);

  // State for storing extracted logo colors
  const [teamLogoColors, setTeamLogoColors] = useState<Record<string, string>>(
    {},
  );

  // Function to extract dominant color from logo
  const extractDominantColorFromLogo = useCallback(
    async (logoUrl: string, teamName: string) => {
      try {
        return new Promise<string>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              resolve(getTeamColor(teamName, true)); // fallback
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const data = imageData.data;

            // Color frequency map
            const colorMap: Record<string, number> = {};

            // Sample every 4th pixel for performance
            for (let i = 0; i < data.length; i += 16) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              // Skip transparent or near-transparent pixels
              if (a < 128) continue;

              // Skip near-white or near-black pixels
              if (
                (r > 240 && g > 240 && b > 240) ||
                (r < 20 && g < 20 && b < 20)
              )
                continue;

              // Group similar colors (reduce precision)
              const rGroup = Math.floor(r / 20) * 20;
              const gGroup = Math.floor(g / 20) * 20;
              const bGroup = Math.floor(b / 20) * 20;

              const colorKey = `${rGroup},${gGroup},${bGroup}`;
              colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
            }

            // Find most frequent color
            let dominantColor = "";
            let maxCount = 0;

            for (const [color, count] of Object.entries(colorMap)) {
              if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
              }
            }

            if (dominantColor) {
              const [r, g, b] = dominantColor.split(",").map(Number);
              // Enhance the color for better visibility
              const enhancedR = Math.min(255, Math.max(40, r * 0.8));
              const enhancedG = Math.min(255, Math.max(40, g * 0.8));
              const enhancedB = Math.min(255, Math.max(40, b * 0.8));

              resolve(`rgb(${enhancedR}, ${enhancedG}, ${enhancedB})`);
            } else {
              resolve(getTeamColor(teamName, true)); // fallback
            }
          };

          img.onerror = () => {
            resolve(getTeamColor(teamName, true)); // fallback
          };

          img.src = logoUrl;
        });
      } catch (error) {
        console.warn("Error extracting color from logo:", error);
        return getTeamColor(teamName, true); // fallback
      }
    },
    [],
  );

  // Extract colors from team logos when match changes
  useEffect(() => {
    if (currentMatch?.teams) {
      const extractColors = async () => {
        const homeTeamName = currentMatch.teams.home.name;
        const awayTeamName = currentMatch.teams.away.name;

        // Only extract if we don't already have the colors cached
        if (!teamLogoColors[homeTeamName] || !teamLogoColors[awayTeamName]) {
          const homeLogoUrl = currentMatch.teams.home.id
            ? `/api/team-logo/square/${currentMatch.teams.home.id}?size=64`
            : currentMatch.teams.home.logo;

          const awayLogoUrl = currentMatch.teams.away.id
            ? `/api/team-logo/square/${currentMatch.teams.away.id}?size=64`
            : currentMatch.teams.away.logo;

          try {
            const [homeColor, awayColor] = await Promise.all([
              extractDominantColorFromLogo(homeLogoUrl, homeTeamName),
              extractDominantColorFromLogo(awayLogoUrl, awayTeamName),
            ]);

            setTeamLogoColors((prev) => ({
              ...prev,
              [homeTeamName]: homeColor,
              [awayTeamName]: awayColor,
            }));
          } catch (error) {
            console.warn("Error extracting team colors:", error);
          }
        }
      };

      extractColors();
    }
  }, [currentMatch, extractDominantColorFromLogo, teamLogoColors]);

  // Countdown timer effect for upcoming matches
  useEffect(() => {
    if (!currentMatch) {
      setCountdownTimer("--:--:--");
      return;
    }

    const statusInfo = getStatusDisplay(currentMatch);

    // Only show countdown for upcoming matches
    if (!statusInfo.isUpcoming) {
      setCountdownTimer("");
      return;
    }

    function updateTimer() {
      try {
        const targetDate = parseISO(currentMatch.fixture.date);

        // Use current real time for accurate countdown
        const now = new Date();

        const diff = targetDate.getTime() - now.getTime();

        if (diff <= 0) {
          setCountdownTimer("Starting now");
          return;
        }

        // Calculate time components
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Only show countdown if match is within 12 hours
        if (totalHours > 12) {
          setCountdownTimer("");
          return;
        }

        // If more than 99 hours, show days and hours
        if (totalHours > 99) {
          const days = Math.floor(totalHours / 24);
          const remainingHours = totalHours % 24;
          setCountdownTimer(`${days}d ${remainingHours}h`);
        } else {
          // Format with leading zeros for HH:mm:ss format
          const formattedHours = totalHours.toString().padStart(2, "0");
          const formattedMinutes = minutes.toString().padStart(2, "0");
          const formattedSeconds = seconds.toString().padStart(2, "0");

          setCountdownTimer(
            `${formattedHours}:${formattedMinutes}:${formattedSeconds}`,
          );
        }
      } catch (error) {
        console.error("Error calculating countdown:", error);
        setCountdownTimer("--:--:--");
      }
    }

    // Calculate initial time
    updateTimer();

    // Set interval to update every second
    const interval = setInterval(updateTimer, 1000);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentMatch]);

  const getEnhancedTeamColor = useCallback(
    (teamName: string, isHome: boolean = false) => {
      // Use extracted logo color if available, otherwise fallback to team color
      const extractedColor = teamLogoColors[teamName];
      if (extractedColor) {
        return extractedColor;
      }

      // Fallback to existing color extraction
      return getTeamColor(teamName, isHome);
    },
    [teamLogoColors, getTeamColor],
  );

  if (isLoading) {
    return (
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 justify-center">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Match status skeleton */}
            <div className="text-center">
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto" />
            </div>

            {/* Teams display skeleton */}
            <div className="relative mt-4">
              <div className="flex relative h-[53px] rounded-md mb-8">
                <div className="w-full h-full flex justify-between relative">
                  {/* Home team section */}
                  <div className="flex items-center w-[45%]">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 ml-4" />
                  </div>

                  {/* VS section */}
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>

                  {/* Away team section */}
                  <div className="flex items-center justify-end w-[45%]">
                    <Skeleton className="h-6 w-24 mr-4" />
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Match details skeleton */}
              <div className="text-center">
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex justify-around border-t border-gray-200 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-5 w-5 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

            {/* Navigation indicators skeleton */}
            <div className="flex justify-center mt-4 gap-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-1.5 h-1.5 rounded-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4 overflow-hidden">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm"></CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {allMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-1">No featured matches</p>
            <p className="text-sm">Check back later for upcoming games</p>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation arrows */}
            {allMatches.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute -left-8 top-1/2 transform -translate-y-1/2 z-10 bg-gray-200 hover:bg-gray-300 border-2 border-gray-400 rounded-full p-3 "
                >
                  <ChevronLeft className="h-4 w-3" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute -right-8 top-1/2 transform -translate-y-1/2 z-10 bg-gray-200 hover:bg-gray-300 border-2 border-gray-400 rounded-full p-3 "
                >
                  <ChevronRight className="h-4 w-3" />
                </button>
              </>
            )}

            {/* Single match display */}
            <AnimatePresence mode="wait">
              {currentMatch && (
                <motion.div
                  key={`match-${currentMatch.fixture.id}-${currentMatchIndex}`}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                  className="cursor-pointer"
                  onClick={() => navigate(`/match/${currentMatch.fixture.id}`)}
                >
                  {/* League header */}
                  <div className="flex items-center justify-center gap-2 mb-4 p-2">
                    <LazyImage
                      src={
                        currentMatch.league.name?.toLowerCase().includes('cotif') 
                          ? "/assets/matchdetaillogo/SGCUNl9j-zkh3mv3i.png"
                          : currentMatch.league.logo
                      }
                      alt={currentMatch.league.name}
                      className="w-6 h-6"
                      fallbackSrc="/assets/fallback-logo.svg"
                    />
                    <span className="text-sm font-md text-gray-700">
                      {currentMatch.league.name}
                    </span>
                    {(() => {
                      // Comprehensive round data extraction from multiple API sources
                      let roundInfo =
                        currentMatch.league.round ||
                        currentMatch.fixture?.round ||
                        currentMatch.league.season?.round ||
                        currentMatch.fixture?.status?.round ||
                        currentMatch.round ||
                        currentMatch.fixture?.status?.long ||
                        currentMatch.league?.season?.current;

                      // Try to get more accurate round info from API if available
                      const cacheKey = `${currentMatch.league.id}-2025`;
                      if (roundsCache[cacheKey] && !roundInfo) {
                        // Use the rounds data to infer current round based on match date
                        const matchDate = new Date(currentMatch.fixture.date);
                        const rounds = roundsCache[cacheKey];
                        // This could be enhanced with more sophisticated logic
                        // For now, we'll still rely on the existing inference
                      }

                      // Enhanced bracket status mapping with comprehensive patterns
                      const getBracketStatus = (
                        leagueName: string,
                        round: string,
                      ) => {
                        const lowerLeague = leagueName.toLowerCase();
                        const lowerRound = round?.toLowerCase() || "";

                        // Normalize common variations
                        const normalizedRound = lowerRound
                          .replace(/\d+st|\d+nd|\d+rd|\d+th/g, "") // Remove ordinal suffixes
                          .replace(/[-_]/g, " ") // Replace dashes/underscores with spaces
                          .replace(/\s+/g, " ") // Normalize multiple spaces
                          .trim();

                        // Universal tournament stage patterns (highest priority)
                        if (
                          normalizedRound.includes("final") &&
                          !normalizedRound.includes("semi") &&
                          !normalizedRound.includes("quarter") &&
                          !normalizedRound.includes("3rd")
                        ) {
                          return "Final";
                        }
                        if (
                          normalizedRound.includes("semi final") ||
                          normalizedRound.includes("semi-final") ||
                          normalizedRound.includes("semifinal")
                        ) {
                          return "Semi Finals";
                        }
                        if (
                          normalizedRound.includes("quarter final") ||
                          normalizedRound.includes("quarter-final") ||
                          normalizedRound.includes("quarterfinal")
                        ) {
                          return "Quarter Finals";
                        }
                        if (
                          normalizedRound.includes("3rd place") ||
                          normalizedRound.includes("third place") ||
                          normalizedRound.includes("bronze")
                        ) {
                          return "3rd Place Playoff";
                        }

                        // Round-based patterns
                        if (
                          normalizedRound.includes("round of 32") ||
                          normalizedRound.includes("r32")
                        )
                          return "Round of 32";
                        if (
                          normalizedRound.includes("round of 16") ||
                          normalizedRound.includes("r16") ||
                          normalizedRound.includes("last 16")
                        )
                          return "Round of 16";
                        if (
                          normalizedRound.includes("round of 8") ||
                          normalizedRound.includes("r8") ||
                          normalizedRound.includes("last 8")
                        )
                          return "Quarter Finals";
                        if (
                          normalizedRound.includes("round of 4") ||
                          normalizedRound.includes("r4") ||
                          normalizedRound.includes("last 4")
                        )
                          return "Semi Finals";

                        // Group stage patterns
                        if (
                          normalizedRound.includes("group") ||
                          normalizedRound.includes("league phase")
                        )
                          return "Group Stage";

                        // Qualifying patterns
                        if (
                          normalizedRound.includes("qualifying") ||
                          normalizedRound.includes("qualifier") ||
                          normalizedRound.includes("preliminary")
                        ) {
                          if (normalizedRound.includes("final"))
                            return "Qualifying Final";
                          return "Qualifying Round";
                        }
                        if (
                          normalizedRound.includes("play off") ||
                          normalizedRound.includes("playoff") ||
                          normalizedRound.includes("play-off")
                        ) {
                          return "Play-off Round";
                        }

                        // Knockout stage patterns
                        if (normalizedRound.includes("knockout"))
                          return "Knockout Stage";

                        // Competition-specific patterns
                        if (lowerLeague.includes("champions league")) {
                          if (normalizedRound.includes("1st knockout"))
                            return "Round of 16";
                        }

                        if (lowerLeague.includes("nations league")) {
                          if (normalizedRound.includes("league"))
                            return "League Phase";
                        }

                        // Youth tournament patterns
                        if (
                          lowerLeague.includes("u21") ||
                          lowerLeague.includes("under 21") ||
                          lowerLeague.includes("youth")
                        ) {
                          if (normalizedRound.includes("group"))
                            return "Group Stage";
                        }

                        // FIFA Club World Cup patterns
                        if (
                          lowerLeague.includes("fifa club world cup") ||
                          lowerLeague.includes("club world cup")
                        ) {
                          if (normalizedRound.includes("group"))
                            return "Group Stage";
                        }

                        // Regular season patterns
                        if (
                          normalizedRound.includes("regular season") ||
                          normalizedRound.includes("matchday") ||
                          normalizedRound.includes("gameweek")
                        ) {
                          return "Matchday";
                        }

                        // Default: return cleaned up round info if it doesn't match patterns
                        if (
                          round &&
                          round.length > 0 &&
                          round !== "TBD" &&
                          round !== "N/A"
                        ) {
                          // Capitalize first letter of each word
                          return round
                            .split(" ")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() +
                                word.slice(1).toLowerCase(),
                            )
                            .join(" ");
                        }

                        return null;
                      };

                      // Enhanced dynamic inference based on league, timing, team profiles, and match count
                      const inferBracketStatus = (
                        leagueName: string,
                        matchDate: Date,
                        teamNames: string[],
                        fixtureId: number,
                      ) => {
                        const lowerLeague = leagueName.toLowerCase();
                        const currentDate = new Date();
                        const daysFromNow =
                          (matchDate.getTime() - currentDate.getTime()) /
                          (1000 * 60 * 60 * 24);

                        // Advanced tournament structure analysis
                        const analyzeTeamProfile = (teams: string[]) => {
                          const profiles = {
                            smallClubProfile: 0,
                            bigClubProfile: 0,
                            qualifyingProfile: 0,
                          };

                          teams.forEach((teamName) => {
                            const lowerName = teamName.toLowerCase();

                            // Small/qualifying club indicators
                            if (
                              lowerName.includes("žalgiris") ||
                              lowerName.includes("penybont") ||
                              lowerName.includes("celje") ||
                              lowerName.includes("sabah") ||
                              lowerName.includes("panevežys") ||
                              lowerName.includes("vikingur") ||