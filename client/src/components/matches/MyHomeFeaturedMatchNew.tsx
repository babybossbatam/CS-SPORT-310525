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

import { RoundBadge } from "@/components/ui/round-badge";

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
  39, 140, 135, 78, 61, 2, 3, 5, 1, 4, 15, 38, 9, 16,
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

                    // Exclude women's competitions and Oberliga leagues
                    const leagueName = fixture.league?.name?.toLowerCase() || "";
                    const country = fixture.league?.country?.toLowerCase() || "";

                    // Exclude women's competitions
                    const isWomensCompetition = leagueName.includes("women") || 
                      leagueName.includes("femenina") || 
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    // Exclude Oberliga leagues (German regional leagues)
                    const isOberligaLeague = leagueName.includes("oberliga");

                    const shouldInclude = hasValidTeams && isNotLive && !isWomensCompetition && !isOberligaLeague;

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
                    } else if (isOberligaLeague) {
                      console.log(
                        `❌ [MyHomeFeaturedMatchNew] Excluding Oberliga league:`,
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

                  // Check if it involves popular teams
                  const homeTeamId = fixture.teams?.home?.id;
                  const awayTeamId = fixture.teams?.away?.id;
                  const homeTeam = fixture.teams?.home?.name?.toLowerCase() || "";
                  const awayTeam = fixture.teams?.away?.name?.toLowerCase() || "";

                  // First check by team ID (most accurate)
                  const hasPopularTeamById = POPULAR_TEAM_IDS.includes(homeTeamId) || POPULAR_TEAM_IDS.includes(awayTeamId);

                  if (hasPopularTeamById) {
                    console.log(`🎯 [MyHomeFeaturedMatchNew] Popular club friendly found by ID: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                    return true;
                  }

                  // Fallback to name matching
                  const hasPopularTeamByName = POPULAR_TEAM_NAMES.some(popularTeam => 
                    homeTeam.includes(popularTeam) || awayTeam.includes(popularTeam)
                  );

                  if (hasPopularTeamByName) {
                    console.log(`🎯 [MyHomeFeaturedMatchNew] Popular club friendly found by name: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                    return true;
                  }

                  // Enhanced keyword-based matching for major clubs
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

                  const hasKeywordMatch = popularTeamKeywords.some(keyword => 
                    homeTeam.includes(keyword) || awayTeam.includes(keyword)
                  );

                  if (hasKeywordMatch) {
                    console.log(`🎯 [MyHomeFeaturedMatchNew] Popular club friendly found by keyword: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                    return true;
                  }

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

                    // Exclude women's competitions and Oberliga leagues
                    const isWomensCompetition = leagueName.includes("women") || 
                      leagueName.includes("femenina") || 
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    // Exclude Oberliga leagues (German regional leagues)
                    const isOberligaLeague = leagueName.includes("oberliga");

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

                        // First check by team ID (most accurate)
                        if (homeTeamId && awayTeamId) {
                          const hasPopularTeamById = POPULAR_TEAM_IDS.includes(homeTeamId) || POPULAR_TEAM_IDS.includes(awayTeamId);
                          if (hasPopularTeamById) {
                            console.log(`✅ [MyHomeFeaturedMatchNew] Popular club friendly found by ID: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`);
                            return true;
                          }
                        }

                        // Fallback to name matching (for cases where ID matching fails)
                        const hasPopularTeamByName = POPULAR_TEAM_NAMES.some(popularTeam => 
                          homeTeam.includes(popularTeam) || awayTeam.includes(popularTeam)
                        );

                        if (hasPopularTeamByName) {
                          console.log(`✅ [MyHomeFeaturedMatchNew] Popular club friendly found by name: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`);
                          return true;
                        }

                        // Enhanced keyword-based matching for team variations including full names
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

                        const hasKeywordMatch = popularTeamKeywords.some(keyword => 
                          homeTeam.includes(keyword) || awayTeam.includes(keyword)
                        );

                        if (hasKeywordMatch) {
                          console.log(`✅ [MyHomeFeaturedMatchNew] Popular club friendly found by keyword: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`);
                          return true;
                        }

                        console.log(`❌ [MyHomeFeaturedMatchNew] Club friendly excluded (no popular teams): ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`);
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
                      !isWomensCompetition &&
                      !isOberligaLeague
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

                    // Exclude women's competitions and Oberliga leagues
                    const leagueName = fixture.league?.name?.toLowerCase() || "";
                    const country = fixture.league?.country?.toLowerCase() || "";

                    // Exclude women's competitions
                    const isWomensCompetition = leagueName.includes("women") || 
                      leagueName.includes("femenina") || 
                      leagueName.includes
("feminine") ||
                      leagueName.includes("feminin");

                    // Exclude Oberliga leagues (German regional leagues)
                    const isOberligaLeague = leagueName.includes("oberliga");

                      return hasValidTeams && isNotLive && isNotDuplicate && !isWomensCompetition && !isOberligaLeague;
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

        // Enhanced debug logging with league IDs
        const fixtureDetails = uniqueFixtures.map((f) => ({
          id: f.fixture.id,
          teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
          league: f.league.name,
          leagueId: f.league.id,
          country: f.league.country,
          status: f.fixture.status.short,
          date: f.fixture.date,
        }));

        console.log(`📋 [MyHomeFeaturedMatchNew] Fixture details with League IDs:`, fixtureDetails);

        // Special debug for Oberliga leagues
        const oberligaMatches = uniqueFixtures.filter(f => 
          f.league.name?.toLowerCase().includes('oberliga')
        );

        if (oberligaMatches.length > 0) {
          console.log(`🎯 [OBERLIGA LEAGUES FOUND] Count: ${oberligaMatches.length}`);
          oberligaMatches.forEach(match => {
            console.log(`🏆 [OBERLIGA MATCH]`, {
              LEAGUE_ID: match.league.id,
              LEAGUE_NAME: match.league.name,
              MATCH: `${match.teams.home.name} vs ${match.teams.away.name}`,
              COUNTRY: match.league.country,
              STATUS: match.fixture.status.short
            });
          });
        }

        // Special debug for Bayern Süd
        const bayernSudMatches = uniqueFixtures.filter(f => 
          f.league.name?.toLowerCase().includes('bayern') && 
          f.league.name?.toLowerCase().includes('süd')
        );

        if (bayernSudMatches.length > 0) {
          console.log(`🏰 [BAYERN SÜD LEAGUES FOUND] Count: ${bayernSudMatches.length}`);
          bayernSudMatches.forEach(match => {
            console.log(`⚽ [BAYERN SÜD MATCH]`, {
              LEAGUE_ID: match.league.id,
              LEAGUE_NAME: match.league.name,
              MATCH: `${match.teams.home.name} vs ${match.teams.away.name}`,
              COUNTRY: match.league.country,
              STATUS: match.fixture.status.short
            });
          });
        }

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
                  onClick={() => {
                    // Debug logging for league identification
                    console.log(`🔍 [FEATURED MATCH DEBUG] League ID Debug:`, {
                      leagueId: currentMatch.league.id,
                      leagueName: currentMatch.league.name,
                      leagueCountry: currentMatch.league.country,
                      matchId: currentMatch.fixture.id,
                      homeTeam: currentMatch.teams.home.name,
                      awayTeam: currentMatch.teams.away.name,
                      fixtureStatus: currentMatch.fixture.status.short
                    });

                    // Special debug for Oberliga leagues
                    if (currentMatch.league.name?.toLowerCase().includes('oberliga')) {
                      console.log(`🎯 [OBERLIGA DEBUG] Found Oberliga league:`, {
                        LEAGUE_ID: currentMatch.league.id,
                        LEAGUE_NAME: currentMatch.league.name,
                        FULL_MATCH_INFO: `${currentMatch.teams.home.name} vs ${currentMatch.teams.away.name}`,
                        COUNTRY: currentMatch.league.country
                      });
                    }

                    // Special debug for Bayern Süd
                    if (currentMatch.league.name?.toLowerCase().includes('bayern') || 
                        currentMatch.league.name?.toLowerCase().includes('süd')) {
                      console.log(`🏰 [BAYERN SÜD DEBUG] Found Bayern Süd related league:`, {
                        LEAGUE_ID: currentMatch.league.id,
                        LEAGUE_NAME: currentMatch.league.name,
                        MATCH_DETAILS: `${currentMatch.teams.home.name} vs ${currentMatch.teams.away.name}`
                      });
                    }

                    navigate(`/match/${currentMatch.fixture.id}`);
                  }}
                >
                  {/* League header */}
                  <div 
                    className="flex items-center justify-center gap-2 mb-4 p-2"
                    onClick={() => {
                      console.log(`🔍 [LEAGUE HEADER DEBUG] Clicked on league:`, {
                        LEAGUE_ID: currentMatch.league.id,
                        LEAGUE_NAME: currentMatch.league.name,
                        LEAGUE_COUNTRY: currentMatch.league.country,
                        LEAGUE_LOGO: currentMatch.league.logo
                      });
                    }}
                  >
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
                    <span 
                      className="text-sm font-medium text-gray-700 text-center"
                      title={`League ID: ${currentMatch.league.id} | ${currentMatch.league.name} | ${currentMatch.league.country}`}
                    >
                      {currentMatch.league.name}
                    </span>

                    {/* Round/Bracket Status Display using RoundBadge component */}
                    <RoundBadge 
                      leagueId={currentMatch.league.id}
                      currentRound={
                        currentMatch.fixture?.round ||
                        currentMatch.league?.round ||
                        currentMatch.fixture?.status?.round ||
                        currentMatch.league?.season?.round ||
                        currentMatch.round ||
                        currentMatch.fixture?.status?.long ||
                        currentMatch.league?.season?.current
                      }
                      matchStatus={currentMatch.fixture.status.short}
                      className="ml-2"
                    />

                    {/* Live Status Badge */}
                    {getStatusDisplay(currentMatch).isLive && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border border-red-500 text-red-500 animate-pulse bg-red-50"
                        >
                          LIVE
                        </Badge>
                      </div>
                    )}
                  </div>


                  {/* Match day indicator */}
                  <div className="text-center mb-4 ">
                    <div className="text-lg font-bold text-gray-800 ">
                      {(() => {
                        const statusInfo = getStatusDisplay(currentMatch);
                        const matchStatus = currentMatch.fixture.status.short;
                        const matchDate = new Date(currentMatch.fixture.date);
                        const today = new Date();
                        const tomorrow = addDays(today, 1);

                        const matchDateString = format(matchDate, "yyyy-MM-dd");
                        const todayString = format(today, "yyyy-MM-dd");
                        const tomorrowString = format(tomorrow, "yyyy-MM-dd");

                        // Live matches - show elapsed time and live score
                        if (statusInfo.isLive) {
                          const elapsed = currentMatch.fixture.status.elapsed;
                          const homeScore = currentMatch.goals.home ?? 0;
                          const awayScore = currentMatch.goals.away ?? 0;

                          return (
                            <div className="space-y-1">
                              <div className="text-red-600 text-sm flex items-center justify-center gap-2">
                                {elapsed && <span className="animate-pulse" style={{animation: 'truePulse 2s infinite ease-in-out'}}> {elapsed}'</span>}
                              </div>
                              <div className="text-2xl font-md">
                                {homeScore} - {awayScore}
                              </div>
                            </div>
                          );
                        }

                        // Ended matches - show final score
                        if (
                          matchStatus === "FT" ||
                          matchStatus === "AET" ||
                          matchStatus === "PEN"
                        ) {
                          const homeScore = currentMatch.goals.home ?? 0;
                          const awayScore = currentMatch.goals.away ?? 0;

                          return (
                            <div className="space-y-0">
                              <div className="text-gray-600 text-sm ">
                                {matchStatus === "FT"
                                  ? "Ended"
                                  : matchStatus === "AET"
                                    ? "After Extra Time"
                                    : matchStatus === "PEN"
                                      ? "After Penalties"
                                      : "Ended"}
                              </div>
                              <div className="text-3xl font-bold">
                                {homeScore} - {awayScore}
                              </div>
                              {/* Show penalty scores if match ended in penalties */}
                              {matchStatus === "PEN" && currentMatch.score?.penalty && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Penalties: {currentMatch.score.penalty.home} - {currentMatch.score.penalty.away}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Upcoming matches - show countdown timer if within 8 hours, otherwise date
                        const upcomingContent = (() => {
                          // Show countdown timer if available and not empty
                          if (
                            countdownTimer &&
                            countdownTimer !== "" &&
                            countdownTimer !== "Loading..." &&
                            countdownTimer !== "--:--:--"
                          ) {
                            return countdownTimer;
                          }

                          // Fallback to date labeling
                          if (matchDateString === todayString) {
                            return "Today";
                          } else if (matchDateString === tomorrowString) {
                            return "Tomorrow";
                          } else {
                            // Calculate days difference for upcoming matches
                            const daysDiff = Math.ceil(
                              (matchDate.getTime() - today.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );

                            if (daysDiff > 0 && daysDiff <= 7) {
                              // For matches within a week, show just the number of days
                              return `${daysDiff} ${daysDiff === 1 ? "Day" : "Days"}`;
                            } else if (daysDiff > 7) {
                              // For matches more than a week away, show date
                              return format(matchDate, "EEEE, MMM d");
                            } else {
                              // For past matches that aren't ended (edge case)
                              return format(matchDate, "EEEE, MMM d");
                            }
                          }
                        })();

                        return (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600 invisible">
                              {/* Hidden status placeholder to maintain spacing */}
                              Ended
                            </div>
                            <div className="text-2xl font-md min-h-[1rem] flex items-center justify-center">
                              {upcomingContent}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Teams display using colored bar like FixedScoreboard */}
                  <div className="relative mt-2">
                    <div
                      className="flex relative h-[53px] rounded-md mb-8"
                      onClick={() =>
                        navigate(`/match/${currentMatch.fixture.id}`)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div className="w-full h-full flex justify-between relative">
                        {/* Home team colored bar and logo */}

                        <div
                          className="h-full w-[calc(50%+20px)] ml-[34px] transition-all duration-500 ease-in-out opacity-100 relative "
                          style={{
                            background: getEnhancedTeamColor(
                              currentMatch?.teams?.home?.name || "Home Team",
                              true,
                            ),
                            transition: "all 0.3s ease-in-out",
                            clipPath:
                              "polygon(0 0, 100% 0, 100% 100%, 100% 100%, 100%)",
                            right: "-15px",
                          }}
                        >
                          {currentMatch?.teams?.home && (
                            <div
                              className="absolute z-20 w-[64px] h-[64px] transition-all duration-300 ease-in-out"
                              style={{
                                cursor: "pointer",
                                top: "calc(50% - 32px)",
                                left: "-38px",
                                filter: "contrast(115%) brightness(105%)",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/match/${currentMatch.fixture.id}`);
                              }}
                            >
                              <MyWorldTeamLogo
                                teamName={
                                  currentMatch.teams.home.name || "Home Team"
                                }
                                teamLogo={
                                  currentMatch.teams.home.id
                                    ? `/api/team-logo/square/${currentMatch.teams.home.id}?size=64`
                                    : currentMatch.teams.home.logo ||
                                      "/assets/fallback-logo.svg"
                                }
                                alt={
                                  currentMatch.teams.home.name || "Home Team"
                                }
                                size="64px"
                                className="w-full h-full object-contain"
                                leagueContext={{
                                  name: currentMatch.league.name,
                                  country: currentMatch.league.country,
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div
                          className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
                          style={{
                            top: "calc(50% - 13px)",
                            left: "83px",
                            fontSize: "1.24rem",
                            fontWeight: "normal",
                          }}
                        >
                          {currentMatch?.teams?.home?.name || "TBD"}
                        </div>

                        {/* VS circle */}
                        <div
                          className="absolute text-white font-md text-3xl  h-[52px] w-[52px] flex items-center justify-center z-30 overflow-hidden"
                          style={{
                            background: "transparent",
                            left: "calc(50% - 25px)",
                            top: "calc(50% - 26px)",
                            minWidth: "52px",
                          }}
                        >
                          <span className="vs-text font-bold">VS</span>
                        </div>

                        {/* Match date and venue - centered below VS */}
                        <div
                          className=" absolute text-center text-xs text-black font-medium"
                          style={{
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap",
                            overflow: "visible",
                            textAlign: "center",
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            top: "60px",
                            bottom: "-15px",
                            width: "max-content",
                            fontFamily: "'Inter', system-ui, sans-serif",
                          }}
                        >
                          {(() => {
                            try {
                              const matchDate = new Date(
                                currentMatch.fixture.date,
                              );
                              const formattedDate = format(
                                matchDate,
                                "EEEE, do MMMM",
                              );
                              const timeOnly = format(matchDate, "HH:mm");

                              // Safely get venue with proper fallbacks
                              let displayVenue = currentMatch.fixture?.venue?.name || null;

                              // Check if venue is missing or has placeholder values
                              if (
                                !displayVenue ||
                                displayVenue === "TBD" ||
                                displayVenue === "Venue TBA" ||
                                displayVenue === "" ||
                                displayVenue === "Unknown"
                              ) {
                                displayVenue = null; // No valid venue found
                              }

                              return (
                                <>
                                  {formattedDate} | {timeOnly}
                                  {displayVenue ? ` | ${displayVenue}` : ""}
                                </>
                              );
                            } catch (e) {
                              console.warn(
                                "Error formatting match date/venue:",
                                e,
                              );
                              return "Match details unavailable";
                            }
                          })()}
                        </div>

                        {/* Away team colored bar and logo */}
                        <div
                          className="h-full w-[calc(50%+16px)] mr-[35px] transition-all duration-500 ease-in-out opacity-100"
                          style={{
                            background: getEnhancedTeamColor(
                              currentMatch?.teams?.away?.name || "Away Team",
                              false,
                            ),
                            transition: "all 0.3s ease-in-out",
                            clipPath:
                              "polygon(15px 0, 100% 0, 100% 100%, 0 100%)",
                            marginLeft: "-15px",
                          }}
                        ></div>

                        <div
                          className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px] font-sans"
                          style={{
                            top: "calc(50% - 15px)",
                            right: "88px",
                            fontSize: "1.24rem",
                            fontWeight: "normal",
                          }}
                        >
                          {currentMatch?.teams?.away?.name || "Away Team"}
                        </div>

                        <div
                          className="absolute z-20 w-[64px] h-[64px] transition-all duration-300 ease-in-out"
                          style={{
                            cursor: "pointer",
                            top: "calc(50% - 35px)",
                            right: "55px",
                            transform: "translateX(50%)",
                            filter: "contrast(115%) brightness(105%)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/match/${currentMatch.fixture.id}`);
                          }}
                        >
                          <MyWorldTeamLogo
                            teamName={
                              currentMatch?.teams?.away?.name || "Away Team"
                            }
                            teamLogo={
                              currentMatch.teams.away.id
                                ? `/api/team-logo/square/${currentMatch.teams.away.id}?size=64`
                                : currentMatch?.teams?.away?.logo ||
                                  `/assets/fallback-logo.svg`
                            }
                            alt={currentMatch?.teams?.away?.name || "Away Team"}
                            size="70px"
                            className="w-full hull object-contain"
                            leagueContext={{
                              name: currentMatch.league.name,
                              country: currentMatch.league.country,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-around border-t border-gray-200 pt-4">
                    <button
                      className="flex flex-col items-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/match/${currentMatch.fixture.id}`);
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        className="text-blue-500"
                      >
                        <path
                          d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-xs text-gray-600 mt-1">
                        Match Page
                      </span>
                    </button>
                    <button
                      className="flex flex-col items-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        className="text-blue-500"
                      >
                        <path
                          d="M21.5 4H2.5C2.22386 4 2 4.22386 2 4.5V19.5C2 19.7761 2.22386 20 2.5 20H21.5C21.7761 20 22 19.7761 22 19.5V4.5C22 4.22386 21.7761 4 21.5 4Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d="M21.5 9H18.5C18.2239 9 18 9.22386 18 9.5V14.5C18 14.7761 18.2239 15 18.5 15H21.5C21.7761 15 22 14.7761 22 14.5V9.5C22 9.22386 21.7761 9 21.5 9Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d="M5.5 9H2.5C2.22386 9 2 9.22386 2 9.5V14.5C2 14.7761 2.22386 15 2.5 15H5.5C5.77614 15 6 14.7761 6 14.5V9.5C6 9.22386 5.77614 9 5.5 9Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                      <span className="text-xs text-gray-600 mt-1">
                        Lineups
                      </span>
                    </button>
                    <button
                      className="flex flex-col items-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        className="text-blue-500"
                      >
                        <path
                          d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM19.931 11H13V4.069C14.7598 4.29335 16.3953 5.09574 17.6498 6.3502C18.9043 7.60466 19.7066 9.24017 19.931 11ZM4 12C4 7.928 7.061 4.564 11 4.069V12C11.003 12.1526 11.0409 12.3024 11.111 12.438C11.126 12.468 11.133 12.501 11.152 12.531L15.354 19.254C14.3038 19.7442 13.159 19.9988 12 20C7.589 20 4 16.411 4 12ZM17.052 18.196L13.805 13H19.931C19.6746 15.0376 18.6436 16.8982 17.052 18.196Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-xs text-gray-600 mt-1">Stats</span>
                    </button>
                    <button
                      className="flex flex-col items-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/league/${currentMatch.league.id}/standings`);
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        className="text-blue-500"
                      >
                        <path
                          d="M4 6H6V8H4V6ZM4 11H6V13H4V11ZM4 16H6V18H4V16ZM20 8V6H8.023V8H18.8H20ZM8 11H20V13H8V11ZM8 16H20V18H8V16Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-xs text-gray-600 mt-1">Groups</span>
                    </button>
                  </div>

                  {/* Slide indicators */}
                  {allMatches.length > 1 && (
                    <div className="flex justify-center mt-4 gap-1">
                      {allMatches.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentMatchIndex(index);
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            index === currentMatchIndex
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default MyHomeFeaturedMatchNew;