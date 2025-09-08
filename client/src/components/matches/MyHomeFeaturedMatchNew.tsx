import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { fixtureCache } from "@/lib/fixtureCache";
import TeamLogo from "./TeamLogo";
import LazyImage from "../common/LazyImage";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import {
  getTeamColor,
  getEnhancedHomeTeamGradient,
} from "@/lib/colorExtractor";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, useLanguage } from "@/contexts/LanguageContext";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";
import { useSelectiveMatchUpdate } from "@/lib/selectiveMatchUpdates";

// Popular teams data
const POPULAR_TEAMS_DATA = [
  { id: 33, name: "Manchester United", country: "England" },
  { id: 40, name: "Liverpool", country: "England" },
  { id: 50, name: "Manchester City", country: "England" },
  { id: 42, name: "Arsenal", country: "England" },
  { id: 49, name: "Chelsea", country: "England" },
  { id: 541, name: "Real Madrid", country: "Spain" },
  { id: 529, name: "FC Barcelona", country: "Spain" },
  { id: 47, name: "Tottenham", country: "England" },
  { id: 157, name: "Bayern Munich", country: "Germany" },
  { id: 489, name: "AC Milan", country: "Italy" },
  { id: 492, name: "Inter", country: "Italy" },
  { id: 496, name: "Juventus", country: "Italy" },
  { id: 165, name: "Borussia Dortmund", country: "Germany" },

  { id: 168, name: "Bayer Leverkusen", country: "Germany" },
  { id: 81, name: "PSG", country: "France" },
  { id: 85, name: "Lyon", country: "France" },
  { id: 212, name: "Marseille", country: "France" },
  { id: 548, name: "Atletico Madrid", country: "Spain" },
  { id: 530, name: "Sevilla", country: "Spain" },
  { id: 532, name: "Valencia", country: "Spain" },
  { id: 533, name: "Villarreal", country: "Spain" },
  { id: 610, name: "Ajax", country: "Netherlands" },
  { id: 194, name: "PSV", country: "Netherlands" },
  { id: 120, name: "Feyenoord", country: "Netherlands" },
  { id: 211, name: "Porto", country: "Portugal" },
  { id: 212, name: "Benfica", country: "Portugal" },
  { id: 228, name: "Sporting CP", country: "Portugal" },
  // Additional popular teams from various leagues
  { id: 502, name: "Napoli", country: "Italy" },
  { id: 500, name: "AS Roma", country: "Italy" },
  { id: 505, name: "Lazio", country: "Italy" },

  // Popular reserve/academy teams
  { id: 1859, name: "Bayern München II", country: "Germany" },
  { id: 1860, name: "Borussia Dortmund II", country: "Germany" },
  { id: 8572, name: "Jong PSV", country: "Netherlands" },
  { id: 8564, name: "Jong Ajax", country: "Netherlands" },
];

const POPULAR_TEAM_IDS = POPULAR_TEAMS_DATA.map((team) => team.id);
const POPULAR_TEAM_NAMES = POPULAR_TEAMS_DATA.map((team) =>
  team.name.toLowerCase(),
);

// Popular team keywords for enhanced matching
const POPULAR_TEAM_KEYWORDS = [
  "realmadrid",
  "barcelona",
  "manchestercity",
  "manchesterunited",
  "manchester",
  "bayernmunich",
  "bayern",
  "juventus",
  "psg",
  "paris saint-germain",
  "paris saint germain",
  "liverpool",
  "arsenal",
  "chelsea",
  "atleticomadrid",
  "atletico",
  "tottenham",
  "ac milan",
  "inter milan",
  "inter",
  "napoli",
  "roma",
  "as roma",
  "borussiadortmund",
  "borussia",
  "dortmund",
  "rbleipzig",
  "leipzig",
  "bayerleverkusen",
  "leverkusen",
  "lyon",
  "olympique lyonnais",
  "marseille",
  "olympique marseille",
  "monaco",
  "as monaco",
  "sevilla",
  "valencia",
  "villarreal",
  "ajax",
  "feyenoord",
  "psveindhoven",
  "psv",
  "porto",
  "fcporto",
  "benfica",
  "slbenfica",
  "sportingcp",
  "sportinglisbon",
  "sporting",
  "fenerbahce",
  "galatasaray",
  "besiktas",
  "trabzonspor",
  "millwall",
  "southampton",
  "elche",
  "valencia",
  "newcastle",
  "westham",
  "brighton",
  "brentford",
];

// Helper function to check if a match involves popular teams
const isPopularTeamMatch = (
  homeTeam: string,
  awayTeam: string,
  homeTeamId?: number,
  awayTeamId?: number,
): boolean => {
  // First check by team ID (most accurate)
  if (homeTeamId && awayTeamId) {
    const hasPopularTeamById =
      POPULAR_TEAM_IDS.includes(homeTeamId) ||
      POPULAR_TEAM_IDS.includes(awayTeamId);
    if (hasPopularTeamById) {
      return true;
    }
  }

  // Fallback to name matching
  const homeTeamLower = homeTeam.toLowerCase();
  const awayTeamLower = awayTeam.toLowerCase();

  const hasPopularTeamByName = POPULAR_TEAM_NAMES.some(
    (popularTeam) =>
      homeTeamLower.includes(popularTeam) ||
      awayTeamLower.includes(popularTeam),
  );

  if (hasPopularTeamByName) {
    return true;
  }

  // Enhanced keyword-based matching
  const hasKeywordMatch = POPULAR_TEAM_KEYWORDS.some(
    (keyword) =>
      homeTeamLower.includes(keyword) || awayTeamLower.includes(keyword),
  );

  return hasKeywordMatch;
};
interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
  onMatchSelect?: (matchId: number) => void;
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

// Define featured leagues (UEFA Europa Conference League ID 848 and Regionalliga - Bayern ID 169 explicitly excluded)
const FEATURED_MATCH_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 2, 3, 5, 1, 4, 15, 38, 32, 850, 667, 9, 16, 45, 550, 531,
];

// Explicitly excluded leagues
const EXPLICITLY_EXCLUDED_LEAGUE_IDS = [
  848, 169, 940, 85, 80, 84, 87, 86, 41, 772, 62, 931, 59, 60, 869, 180, 67, 68, 69,
]; // UEFA Europa Conference League, Regionalliga - Bayern, League 940, Regionalliga - Nordost, 3. Liga, Regionalliga - Nord, Regionalliga - West, Regionalliga - SudWest, League One, League 772, Ligue 2, Non League Premier - Southern Central, League 59, League 60, CECAFA Club Cup, National 2 - Group A
const PRIORITY_LEAGUE_IDS = [2, 15, 38, 32, 29, 850, 667, 22, 45, 550, 531]; // UEFA Champions League, FIFA Club World Cup, UEFA U21 Championship, CONCACAF Gold Cup, FA Cup, League 550, League 531

interface FeaturedMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
      season: number;
      rounds: string;
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
    round?: string;
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
  score?: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
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

// Helper function to check if a team is a national team
const isNationalTeam = (team: any, league: any): boolean => {
  const teamName = team.name?.toLowerCase() || "";
  const leagueName = league.name?.toLowerCase() || "";
  const leagueCountry = league.country?.toLowerCase() || "";

  // Common national team indicators in league names or countries
  const nationalLeagueIndicators = [
    "international",
    "world cup",
    "euro",
    "copa america",
    "gold cup",
    "nations league",
    "fifa",
    "uefa",
    "afcon",
    "asian cup",
    "olympics",
    "u20",
    "u21",
    "u23",
    "women",
  ];

  // Check if league name suggests national competition
  if (nationalLeagueIndicators.some((indicator) => leagueName.includes(indicator))) {
    return true;
  }

  // Check if league country suggests international/world scope
  if (["world", "europe", "international"].includes(leagueCountry)) {
    return true;
  }

  // Specific team name patterns that might indicate national teams
  if (
    teamName.includes("national team") ||
    teamName.includes("select xi") ||
    teamName.includes("republic of") ||
    teamName.includes("kingdom") ||
    teamName.includes("united") && teamName.includes("states") || // USA
    teamName.includes("canada") ||
    teamName.includes("mexico") ||
    teamName.includes("brazil") ||
    teamName.includes("argentina") ||
    teamName.includes("france") ||
    teamName.includes("germany") ||
    teamName.includes("italy") ||
    teamName.includes("spain") ||
    teamName.includes("england") ||
    teamName.includes("portugal") ||
    teamName.includes("netherlands") ||
    teamName.includes("belgium") ||
    teamName.includes("croatia") ||
    teamName.includes("sweden") ||
    teamName.includes("denmark") ||
    teamName.includes("switzerland")
  ) {
    // Add more common national team names if needed
    return true;
  }

  return false;
};


const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  maxMatches = 15,
  onMatchSelect,
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
    const styleId = "truePulse-animation";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
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
  const {
    translateTeamName,
    translateLeagueName,
    currentLanguage,
    getMatchStatusTranslation,
    learnFromFixtures,
  } = useLanguage();
  const { t } = useTranslation();

  const fetchRoundsForLeague = useCallback(
    async (leagueId: number, season: number) => {
      const cacheKey = `${leagueId}-${season}`;
      if (roundsCache[cacheKey]) {
        return roundsCache[cacheKey];
      }

      try {
        const response = await apiRequest(
          "GET",
          `/api/fixtures/rounds?league=${leagueId}&season=${season}`,
        );
        const rounds = await response.json();

        setRoundsCache((prev) => ({
          ...prev,
          [cacheKey]: rounds,
        }));

        return rounds;
      } catch (error) {
        console.warn(`Failed to fetch rounds for league ${leagueId}:`, error);
        return [];
      }
    },
    [roundsCache],
  );

  // Check if a match ended more than 2 hours ago (performance optimization)
  const isMatchOldEnded = useCallback((fixture: any): boolean => {
    const status = fixture.fixture?.status?.short;
    const isEnded = [
      "FT",
      "AET",
      "PEN",
      "AWD",
      "WO",
      "ABD",
      "CANC",
      "SUSP",
    ].includes(status);

    if (!isEnded) return false;

    const matchDate = new Date(fixture.fixture.date);
    const hoursAgo = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);

    // Use 2-hour rule for better performance
    return hoursAgo > 2;
  }, []);

  // Cache key for ended matches
  const getCacheKey = useCallback((date: string, leagueId: number) => {
    return `ended_matches_${date}_${leagueId}`;
  }, []);

  // Get cached ended matches with strict date validation
  const getCachedEndedMatches = useCallback(
    (date: string, leagueId: number): any[] => {
      try {
        const cacheKey = getCacheKey(date, leagueId);
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return [];

        const { fixtures, timestamp, date: cachedDate } = JSON.parse(cached);

        // CRITICAL: Ensure cached date exactly matches requested date
        if (cachedDate !== date) {
          console.log(
            `🚨 [MyHomeFeaturedMatchNew] Date mismatch in cache - cached: ${cachedDate}, requested: ${date}, clearing cache`,
          );
          localStorage.removeItem(cacheKey);
          return [];
        }

        // Check cache age (24 hours max for ended matches)
        const cacheAge = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < maxAge) {
          // Validate all fixtures are still old ended matches
          const validFixtures = fixtures.filter((fixture: any) =>
            isMatchOldEnded(fixture),
          );

          console.log(
            `✅ [MyHomeFeaturedMatchNew] Using cached ended matches for league ${leagueId} on ${date}: ${validFixtures.length} matches`,
          );
          return validFixtures;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
          console.log(
            `⏰ [MyHomeFeaturedMatchNew] Removed expired cache for league ${leagueId} on ${date} (age: ${Math.round(cacheAge / 60000)}min)`,
          );
        }
      } catch (error) {
        console.error("Error reading cached ended matches:", error);
        // Clear corrupted cache
        const cacheKey = getCacheKey(date, leagueId);
        localStorage.removeItem(cacheKey);
      }

      return [];
    },
    [getCacheKey, isMatchOldEnded],
  );

  // Cache ended matches
  const cacheEndedMatches = useCallback(
    (date: string, leagueId: number, fixtures: any[]) => {
      try {
        const endedFixtures = fixtures.filter(isMatchOldEnded);

        if (endedFixtures.length === 0) return;

        const cacheKey = getCacheKey(date, leagueId);
        const cacheData = {
          fixtures: endedFixtures,
          timestamp: Date.now(),
          date,
          leagueId,
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(
          `💾 [MyHomeFeaturedMatchNew] Cached ${endedFixtures.length} ended matches for league ${leagueId} on ${date}`,
        );
      } catch (error) {
        console.error("Error caching ended matches:", error);
      }
    },
    [getCacheKey, isMatchOldEnded],
  );

  const fetchFeaturedMatches = useCallback(
    async (forceRefresh = false) => {
      try {
        // Only show loading on initial load or force refresh
        if (forceRefresh || featuredMatches.length === 0) {
          setIsLoading(true);
        }

        const now = new Date();
        // ENHANCED cache refresh logic - prioritize live matches and today's ended matches
        const shouldRefresh =
            forceRefresh ||
            featuredMatches.some((dayData) =>
              dayData.matches.some((match) => {
                const status = match.fixture.status.short;
                const matchDate = new Date(match.fixture.date);
                const minutesFromKickoff =
                  (now.getTime() - matchDate.getTime()) / (1000 * 60);
                const hoursFromKickoff = minutesFromKickoff / 60;

                // Check if it's today's match
                const matchDateLocal = format(matchDate, "yyyy-MM-dd");
                const todayLocal = format(now, "yyyy-MM-dd");
                const isToday = matchDateLocal === todayLocal;

                // PRIORITY 1: Always refresh for live matches
                const isLive = [
                  "LIVE",
                  "LIV",
                  "1H",
                  "HT",
                  "2H",
                  "ET",
                  "BT",
                  "P",
                  "INT",
                ].includes(status);

                // PRIORITY 2: Today's matches (any status)
                const isTodaysMatch = isToday;

                // PRIORITY 3: Recently ended matches (within 24 hours)
                const isRecentlyEndedMatch =
                  ["FT", "AET", "PEN"].includes(status) &&
                  Math.abs(hoursFromKickoff) <= 24;

                // PRIORITY 4: Upcoming matches within 4 hours
                const isUpcomingSoon =
                  status === "NS" && Math.abs(minutesFromKickoff) <= 240;

                // PRIORITY 5: Stale "Starting now" matches
                const isStaleStartingNow =
                  status === "NS" &&
                  minutesFromKickoff > 30 &&
                  minutesFromKickoff < 180;

                const shouldRefreshMatch =
                  isLive ||
                  isTodaysMatch ||
                  isRecentlyEndedMatch ||
                  isUpcomingSoon ||
                  isStaleStartingNow;

                if (shouldRefreshMatch) {
                  console.log(
                    `🔄 [REFRESH TRIGGER] Match: ${match.teams.home.name} vs ${match.teams.away.name} (${status}) - Live: ${isLive}, Today: ${isTodaysMatch}, Recent: ${isRecentlyEndedMatch}`,
                  );
                }

                return shouldRefreshMatch;
              }),
            );

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
          return ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
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
          if (shouldRefresh) {
            console.log(
              "🔴 [MyHomeFeaturedMatchNew] Smart cache: Fetching live matches from dedicated endpoint",
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
                    venue: fixture.fixture.venue,
                  },
                  league: {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    country: fixture.league.country,
                    logo: fixture.league.logo,
                    round: fixture.league.round,
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
                  venue: fixture.venue,
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

        // Fetch non-live matches from cached data with smart refresh logic
        if (shouldRefresh || allFixtures.length === 0) {
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

                    // ENHANCED: Include more recent ended matches for featured display
                    const matchDate = new Date(fixture.fixture.date);
                    const hoursFromEnd = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                    const isRecentEnded = ["FT", "AET", "PEN"].includes(fixture.fixture.status.short) && hoursFromEnd <= 48; // Show ended matches up to 48 hours

                    // Only exclude very old ended matches (more than 48 hours)
                    const isVeryOldEnded = ["FT", "AET", "PEN"].includes(fixture.fixture.status.short) && hoursFromEnd > 48;
                    if (isVeryOldEnded) {
                      console.log(
                        `⏰ [MyHomeFeaturedMatchNew] Excluding very old ended match (${fixture.fixture.status.short}):`,
                        {
                          home: fixture.teams?.home?.name,
                          away: fixture.teams?.away?.name,
                          league: fixture.league?.name,
                          date: fixture.fixture.date,
                          hoursAgo: Math.round(hoursFromEnd),
                        },
                      );
                      return false;
                    }

                    // ENHANCED: Exclude matches with conflicting status/time data (but preserve live matches)
                    const minutesFromKickoff =
                      (now.getTime() - matchDate.getTime()) / (1000 * 60);
                    const hoursFromKickoff = minutesFromKickoff / 60;
                    const status = fixture.fixture.status.short;

                    // CRITICAL: Never exclude live matches regardless of time discrepancies
                    const isCurrentlyLive = [
                      "LIVE",
                      "LIV",
                      "1H",
                      "2H",
                      "HT",
                      "ET",
                      "BT",
                      "P",
                      "INT",
                    ].includes(status);

                    // Exclude women's competitions and Oberliga leagues
                    const leagueName =
                      fixture.league?.name?.toLowerCase() || "";
                    const country =
                      fixture.league?.country?.toLowerCase() || "";

                    // EXPLICIT EXCLUSION: UEFA Europa Conference League and Regionalliga - Bayern
                    const isExplicitlyExcluded =
                      EXPLICITLY_EXCLUDED_LEAGUE_IDS.includes(
                        fixture.league?.id,
                      );

                    // Exclude women's competitions
                    const isWomensCompetition =
                      leagueName.includes("women") ||
                      leagueName.includes("femenina") ||
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    // Exclude Oberliga, Regionalliga, and 3. Liga leagues (German regional/lower leagues)
                    const isOberligaLeague = leagueName.includes("oberliga");
                    const isRegionalligaLeague =
                      leagueName.includes("regionalliga") ||
                      leagueName.includes("regional liga");
                    const is3Liga =
                      leagueName.includes("3. liga") ||
                      leagueName.includes("3 liga");

                    // Check for various types of conflicting data (excluding live matches)
                    let hasConflictingData = false;
                    let conflictReason = "";

                    // 1. Ended status but match is far in future (more than 12 hours away)
                    if (
                      minutesFromKickoff < -720 &&
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
                      hasConflictingData = true;
                      conflictReason = `ended status (${status}) for future match`;
                    }

                    // 2. "Not Started" status but match is more than 2 hours past kickoff
                    if (
                      minutesFromKickoff > 120 &&
                      ["NS", "TBD", "PST"].includes(status)
                    ) {
                      hasConflictingData = true;
                      conflictReason = `not started status (${status}) for overdue match`;
                    }

                    // 3. Completely exclude stale ended matches (more than 2 hours old)
                    if (
                      hoursFromKickoff > 2 &&
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
                      return false; // Completely exclude, don't show at all
                    }

                    // Exclude Non League Premier leagues
                    const isNonLeaguePremier =
                      leagueName.includes("non league premier");

                    const shouldInclude =
                      hasValidTeams &&
                      isNotLive &&
                      !isWomensCompetition &&
                      !isOberligaLeague &&
                      !isRegionalligaLeague &&
                      !is3Liga &&
                      !isExplicitlyExcluded &&
                      !isNonLeaguePremier;

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
                    } else if (isRegionalligaLeague) {
                      console.log(
                        `❌ [MyHomeFeaturedMatchNew] Excluding Regionalliga league:`,
                        {
                          league: fixture.league?.name,
                          leagueId: fixture.league?.id,
                        },
                      );
                    } else if (is3Liga) {
                      console.log(
                        `❌ [MyHomeFeaturedMatchNew] Excluding 3. Liga league:`,
                        {
                          league: fixture.league?.name,
                          leagueId: fixture.league?.id,
                        },
                      );
                    } else if (isNonLeaguePremier) {
                      console.log(
                        `❌ [MyHomeFeaturedMatchNew] Excluding Non League Premier:`,
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
                      venue: fixture.fixture.venue,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                      round: fixture.league.round,
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
                    venue: fixture.venue,
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

          // Fetch popular team friendlies and national team friendlies from Friendlies Clubs league (667)
          try {
            console.log(
              `🔍 [MyHomeFeaturedMatchNew] Fetching Friendlies Clubs fixtures for popular teams and national teams`,
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
                  const isNotLive = !isLiveMatch(fixture.fixture.status.short);

                  if (!hasValidTeams || !isNotLive) {
                    return false;
                  }

                  const homeTeamId = fixture.teams?.home?.id;
                  const awayTeamId = fixture.teams?.away?.id;
                  const homeTeam = fixture.teams?.home?.name || "";
                  const awayTeam = fixture.teams?.away?.name || "";

                  // Check if it's a national team match
                  const homeIsNational = isNationalTeam(
                    { name: homeTeam },
                    { name: "Friendlies Clubs", country: "World" }
                  );
                  const awayIsNational = isNationalTeam(
                    { name: awayTeam },
                    { name: "Friendlies Clubs", country: "World" }
                  );
                  const isNationalTeamMatch = homeIsNational || awayIsNational;

                  // Check if it involves popular club teams
                  const isPopular = isPopularTeamMatch(
                    homeTeam,
                    awayTeam,
                    homeTeamId,
                    awayTeamId,
                  );

                  if (isNationalTeamMatch) {
                    console.log(
                      `🏳️ [MyHomeFeaturedMatchNew] National team friendly found: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                    );
                    return true;
                  }

                  if (isPopular) {
                    console.log(
                      `🎯 [MyHomeFeaturedMatchNew] Popular club friendly found: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                    );
                    return true;
                  }

                  return false;
                })
                .map((fixture: any) => ({
                  fixture: {
                    id: fixture.fixture.id,
                    date: fixture.fixture.date,
                    status: fixture.fixture.status,
                    venue: fixture.fixture.venue,
                  },
                  league: {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    country: fixture.league.country,
                    logo: fixture.league.logo,
                    round: fixture.league.round,
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
                  venue: fixture.venue,
                }));

              console.log(
                `🎯 [MyHomeFeaturedMatchNew] Found ${popularFriendlies.length} popular team friendlies`,
              );
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
                    const isNotLive = !isLiveMatch(
                      fixture.fixture.status.short,
                    );
                    const isNotPriorityLeague = !priorityLeagueIds.includes(
                      fixture.league?.id,
                    );

                    // ENHANCED: Exclude matches with conflicting status/time data (but preserve live matches)
                    const matchDate = new Date(fixture.fixture.date);
                    const minutesFromKickoff =
                      (now.getTime() - matchDate.getTime()) / (1000 * 60);
                    const hoursFromKickoff = minutesFromKickoff / 60;
                    const status = fixture.fixture.status.short;

                    // CRITICAL: Never exclude live matches regardless of time discrepancies
                    const isCurrentlyLive = [
                      "LIVE",
                      "LIV",
                      "1H",
                      "2H",
                      "HT",
                      "ET",
                      "BT",
                      "P",
                      "INT",
                    ].includes(status);
                    if (isCurrentlyLive) {
                      console.log(
                        `🔴 [MyHomeFeaturedMatchNew] Preserving live match in date-based search:`,
                        {
                          home: fixture.teams?.home?.name,
                          away: fixture.teams?.away?.name,
                          league: fixture.league?.name,
                          status: status,
                          minutesFromKickoff: minutesFromKickoff.toFixed(1),
                        },
                      );
                      // Skip all-based filtering for live matches
                      return (
                        hasValidTeams &&
                        !isWomensCompetition &&
                        !isOberligaLeague &&
                        !isRegionalligaLeague &&
                        !is3Liga
                      );
                    }

                    // Exclude women's competitions and Oberliga leagues
                    const leagueName =
                      fixture.league?.name?.toLowerCase() || "";
                    const country =
                      fixture.league?.country?.toLowerCase() || "";

                    // Exclude women's competitions
                    const isWomensCompetition =
                      leagueName.includes("women") ||
                      leagueName.includes("femenina") ||
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    // Exclude Oberliga, Regionalliga, and 3. Liga leagues (German regional/lower leagues)
                    const isOberligaLeague = leagueName.includes("oberliga");
                    const isRegionalligaLeague =
                      leagueName.includes("regionalliga") ||
                      leagueName.includes("regional liga");
                    const is3Liga =
                      leagueName.includes("3. liga") ||
                      leagueName.includes("3 liga");

                    // Check for various types of conflicting data (excluding live matches)
                    let hasConflictingData = false;
                    let conflictReason = "";

                    // 1. Ended status but match is far in future (more than 12 hours away)
                    if (
                      minutesFromKickoff < -720 &&
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
                      hasConflictingData = true;
                      conflictReason = `ended status (${status}) for future match`;
                    }

                    // 2. "Not Started" status but match is more than 2 hours past kickoff
                    if (
                      minutesFromKickoff > 120 &&
                      ["NS", "TBD", "PST"].includes(status)
                    ) {
                      hasConflictingData = true;
                      conflictReason = `not started status (${status}) for overdue match`;
                    }

                    // 3. Completely exclude stale ended matches (more than 2 hours old)
                    if (
                      hoursFromKickoff > 2 &&
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
                      return false; // Completely exclude, don't show at all
                    }

                    // Check if it's a popular league or from a popular country
                    const isPopularLeague = POPULAR_LEAGUES.some(
                      (league) => league.id === fixture.league?.id,
                    );
                    const isFromPopularCountry = POPULAR_LEAGUES.some(
                      (league) => league.country.toLowerCase() === country,
                    );

                    // Check if it's an international competition
                    const isInternationalCompetition =
                      leagueName.includes("champions league") ||
                      leagueName.includes("europa league") ||
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
                      (leagueName.includes("friendlies") &&
                        !leagueName.includes("international") &&
                        !leagueName.includes("women")) ||
                      (leagueName.includes("international") &&
                        !leagueName.includes("women")) ||
                      country.includes("world") ||
                      country.includes("europe") ||
                      country.includes("international");

                    // Check if it's a club friendly with popular teams or national team friendly
                    const isPopularClubFriendly = () => {
                      if (
                        leagueName.includes("club friendlies") ||
                        leagueName.includes("friendlies clubs") ||
                        fixture.league.id === 667 ||
                        (leagueName.includes("friendlies") &&
                          !leagueName.includes("international") &&
                          !leagueName.includes("women"))
                      ) {
                        const homeTeamId = fixture.teams?.home?.id;
                        const awayTeamId = fixture.teams?.away?.id;
                        const homeTeam = fixture.teams?.home?.name || "";
                        const awayTeam = fixture.teams?.away?.name || "";

                        // Check if it's a national team match
                        const homeIsNational = isNationalTeam(
                          { name: homeTeam },
                          { name: fixture.league?.name || "", country: fixture.league?.country || "" }
                        );
                        const awayIsNational = isNationalTeam(
                          { name: awayTeam },
                          { name: fixture.league?.name || "", country: fixture.league?.country || "" }
                        );
                        const isNationalTeamMatch = homeIsNational || awayIsNational;

                        if (isNationalTeamMatch) {
                          console.log(
                            `✅ [MyHomeFeaturedMatchNew] National team friendly found: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`,
                          );
                          return true;
                        }

                        const isPopular = isPopularTeamMatch(
                          homeTeam,
                          awayTeam,
                          homeTeamId,
                          awayTeamId,
                        );

                        if (isPopular) {
                          console.log(
                            `✅ [MyHomeFeaturedMatchNew] Popular club friendly found: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`,
                          );
                          return true;
                        }

                        console.log(
                          `❌ [MyHomeFeaturedMatchNew] Club friendly excluded (no popular teams or national teams): ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`,
                        );
                        return false;
                      }
                      return false;
                    };

                    return (
                      hasValidTeams &&
                      isNotLive &&
                      isNotPriorityLeague &&
                      !isWomensCompetition &&
                      !isOberligaLeague &&
                      !isRegionalligaLeague &&
                      !is3Liga &&
                      (isPopularLeague ||
                        isFromPopularCountry ||
                        isInternationalCompetition ||
                        isPopularClubFriendly())
                    );
                  })
                  .map((fixture: any) => ({
                    fixture: {
                      id: fixture.fixture.id,
                      date: fixture.fixture.date,
                      status: fixture.fixture.status,
                      venue: fixture.fixture.venue,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                      round: fixture.league.round,
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
                    venue: fixture.venue,
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

                    // ENHANCED: Exclude matches with conflicting status/time data (but preserve live matches)
                    const matchDate = new Date(fixture.fixture.date);
                    const minutesFromKickoff =
                      (now.getTime() - matchDate.getTime()) / (1000 * 60);
                    const hoursFromKickoff = minutesFromKickoff / 60;
                    const status = fixture.fixture.status.short;

                    // CRITICAL: Never exclude live matches regardless of time discrepancies
                    const isCurrentlyLive = [
                      "LIVE",
                      "LIV",
                      "1H",
                      "2H",
                      "HT",
                      "ET",
                      "BT",
                      "P",
                      "INT",
                    ].includes(status);
                    if (isCurrentlyLive) {
                      console.log(
                        `🔴 [MyHomeFeaturedMatchNew] Preserving live match in expanded search:`,
                        {
                          home: fixture.teams?.home?.name,
                          away: fixture.teams?.away?.name,
                          league: fixture.league?.name,
                          status: status,
                          minutesFromKickoff: minutesFromKickoff.toFixed(1),
                        },
                      );
                      // Skip all filtering for live matches except basic validity
                      return (
                        hasValidTeams &&
                        isNotDuplicate &&
                        !isWomensCompetition &&
                        !isOberligaLeague &&
                        !isRegionalligaLeague &&
                        !is3Liga
                      );
                    }

                    // Exclude women's competitions and Oberliga leagues
                    const leagueName =
                      fixture.league?.name?.toLowerCase() || "";
                    const country =
                      fixture.league?.country?.toLowerCase() || "";

                    // Exclude women's competitions
                    const isWomensCompetition =
                      leagueName.includes("women") ||
                      leagueName.includes("femenina") ||
                      leagueName.includes("feminine") ||
                      leagueName.includes("feminin");

                    // Exclude Oberliga, Regionalliga, and 3. Liga leagues (German regional/lower leagues)
                    const isOberligaLeague = leagueName.includes("oberliga");
                    const isRegionalligaLeague =
                      leagueName.includes("regionalliga") ||
                      leagueName.includes("regional liga");
                    const is3Liga =
                      leagueName.includes("3. liga") ||
                      leagueName.includes("3 liga");

                    // Check for various types of conflicting data (excluding live matches)
                    let hasConflictingData = false;
                    let conflictReason = "";

                    // 1. Ended status but match is far in future (more than 12 hours away)
                    if (
                      minutesFromKickoff < -720 &&
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
                      hasConflictingData = true;
                      conflictReason = `ended status (${status}) for future match`;
                    }

                    // 2. "Not Started" status but match is more than 2 hours past kickoff
                    if (
                      minutesFromKickoff > 120 &&
                      ["NS", "TBD", "PST"].includes(status)
                    ) {
                      hasConflictingData = true;
                      conflictReason = `not started status (${status}) for overdue match`;
                    }

                    // 3. Ended match that's more than 12 hours old (stale ended matches)
                    if (
                      hoursFromKickoff > 12 &&
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
                      hasConflictingData = true;
                      conflictReason = `stale ended match (${status}) more than 12 hours old`;
                    }

                    if (hasConflictingData) {
                      console.log(
                        `🔄 [MyHomeFeaturedMatchNew] Excluding expanded search match with conflicting data - ${conflictReason}:`,
                        {
                          home: fixture.teams?.home?.name,
                          away: fixture.teams?.away?.name,
                          league: fixture.league?.name,
                          date: fixture.fixture.date,
                          status: status,
                          hoursFromNow: hoursFromKickoff.toFixed(1),
                          conflictReason: conflictReason,
                        },
                      );
                      return false;
                    }

                    return (
                      hasValidTeams &&
                      isNotLive &&
                      isNotDuplicate &&
                      !isWomensCompetition &&
                      !isOberligaLeague &&
                      !isRegionalligaLeague &&
                      !is3Liga
                    );
                  })
                  .slice(0, 5) // Limit to prevent overwhelming
                  .map((fixture: any) => ({
                    fixture: {
                      id: fixture.fixture.id,
                      date: fixture.fixture.date,
                      status: fixture.fixture.status,
                      venue: fixture.fixture.venue,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                      round: fixture.league.round,
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
                    venue: fixture.venue,
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

        // Learn from fixtures data to improve translations
        try {
          learnFromFixtures(uniqueFixtures);
          console.log(
            `📚 [MyHomeFeaturedMatchNew] Learning from ${uniqueFixtures.length} fixtures for translation improvement`,
          );

          // Additional league-specific learning for comprehensive coverage
          smartLeagueCountryTranslation.learnFromFixtures(uniqueFixtures);
          console.log(
            `🎓 [MyHomeFeaturedMatchNew] Enhanced league learning from ${uniqueFixtures.length} fixtures for better coverage`,
          );
        } catch (error) {
          console.warn("Error learning from fixtures:", error);
        }

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

        console.log(
          `📋 [MyHomeFeaturedMatchNew] Fixture details with League IDs:`,
          fixtureDetails,
        );

        // Special debug for Oberliga leagues
        const oberligaMatches = uniqueFixtures.filter((f) =>
          f.league.name?.toLowerCase().includes("oberliga"),
        );

        if (oberligaMatches.length > 0) {
          console.log(
            `🎯 [OBERLIGA LEAGUES FOUND] Count: ${oberligaMatches.length}`,
          );
          oberligaMatches.forEach((match) => {
            console.log(`🏆 [OBERLIGA MATCH]`, {
              LEAGUE_ID: match.league.id,
              LEAGUE_NAME: match.league.name,
              MATCH: `${match.teams.home.name} vs ${match.teams.away.name}`,
              COUNTRY: match.league.country,
              STATUS: match.fixture.status.short,
            });
          });
        }

        // Special debug for Bayern Süd
        const bayernSudMatches = uniqueFixtures.filter(
          (f) =>
            f.league.name?.toLowerCase().includes("bayern") &&
            f.league.name?.toLowerCase().includes("süd"),
        );

        if (bayernSudMatches.length > 0) {
          console.log(
            `🏰 [BAYERN SÜD LEAGUES FOUND] Count: ${bayernSudMatches.length}`,
          );
          bayernSudMatches.forEach((match) => {
            console.log(`⚽ [BAYERN SÜD MATCH]`, {
              LEAGUE_ID: match.league.id,
              LEAGUE_NAME: match.league.name,
              MATCH: `${match.teams.home.name} vs ${match.teams.away.name}`,
              COUNTRY: match.league.country,
              STATUS: match.fixture.status.short,
            });
          });
        }

        // Group fixtures by date
        const allMatches: DayMatches[] = [];
        const todayDateString = format(today, "yyyy-MM-dd");

        for (const dateInfo of dates) {
          const isToday = dateInfo.date === todayDateString;

          const fixturesForDay = uniqueFixtures
            .filter((fixture) => {
              // EXPLICIT EXCLUSION: Never show UEFA Europa Conference League (ID 848), Regionalliga - Bayern (ID 169), League 940, or Ligue 2 (ID 62)
              if (fixture.league.id === 848) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] UEFA Europa Conference League match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 169) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - Bayern match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 940) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] League 940 match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 85) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - Nordost match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 80) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] 3. Liga match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 84) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - Nord match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 87) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - West match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }
              if (fixture.league.id === 41) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - SudWest match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }
              if (fixture.league.id === 183) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - SudWest match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }
              if (fixture.league.id === 86) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Regionalliga - SudWest match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 772) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] League 772 match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 62) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Ligue 2 match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 58) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Non League Premier - Isthmian match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 931) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Non League Premier - Southern Central match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 59) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] League 59 match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 60) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] League 60 match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 869) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] CECAFA Club Cup match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 180) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] Scotland Championship match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 67) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] National 2 - Group A match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 68) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] National 2 - Group B match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              if (fixture.league.id === 69) {
                console.log(
                  `🚫 [EXPLICIT EXCLUSION] National 2 - Group C match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }
              // Additional name-based exclusion for Regionalliga leagues and Non League Premier
              const leagueName = fixture.league?.name?.toLowerCase() || "";
              if (
                leagueName.includes("regionalliga") &&
                leagueName.includes("bayern")
              ) {
                console.log(
                  `🚫 [NAME-BASED EXCLUSION] Regionalliga - Bayern match excluded by name: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`,
                );
                return false;
              }
              if (leagueName.includes("non league premier")) {
                console.log(
                  `🚫 [NAME-BASED EXCLUSION] Non League Premier match excluded by name: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (League: ${fixture.league.name})`,
                );
                return false;
              }

              // CRITICAL: Filter out stale "Starting now" matches
              const status = fixture.fixture.status.short;
              const matchDate = new Date(fixture.fixture.date);
              const minutesFromKickoff =
                (now.getTime() - matchDate.getTime()) / (1000 * 60);

              // Remove matches that show "NS" (Not Started) but are significantly past kickoff time
              if (status === "NS" && minutesFromKickoff > 120) {
                console.log(
                  `🚫 [STALE MATCH EXCLUSION] Removing stale "Starting now" match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${Math.round(minutesFromKickoff)} min past kickoff)`,
                );
                return false;
              }

              // Remove matches that are postponed, cancelled, or suspended
              if (
                ["PST", "CANC", "SUSP", "ABD", "AWD", "WO"].includes(status)
              ) {
                console.log(
                  `🚫 [STATUS EXCLUSION] Removing ${status} match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                );
                return false;
              }

              // ENHANCED: For today's matches, include all ended matches within 24 hours and all live matches
              if (isToday) {
                // Always include live matches
                if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                  console.log(
                    `🔴 [TODAY'S LIVE MATCH INCLUSION] Including live match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${status})`,
                  );
                  return true;
                }

                // For ended matches today, use 24-hour window instead of 12
                if (["FT", "AET", "PEN"].includes(status)) {
                  const hoursAgo = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                  if (hoursAgo > 24) {
                    console.log(
                      `🕐 [TODAY'S ENDED MATCH EXCLUSION] Removing match older than 24 hours: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${Math.round(hoursAgo)} hours ago)`,
                    );
                    return false;
                  } else {
                    console.log(
                      `✅ [TODAY'S ENDED MATCH INCLUSION] Including today's ended match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${Math.round(hoursAgo)} hours ago)`,
                    );
                  }
                }
              }

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

              // Define match status categories
              const aStatus = a.fixture.status.short;
              const bStatus = b.fixture.status.short;

              const aLive = isLiveMatch(aStatus);
              const bLive = isLiveMatch(bStatus);

              const aEnded = isEndedMatch(aStatus);
              const bEnded = isEndedMatch(bStatus);

              const aUpcoming = isUpcomingMatch(aStatus);
              const bUpcoming = isUpcomingMatch(bStatus);

              // NEW: Check if matches are today's matches
              const aMatchDate = new Date(a.fixture.date);
              const bMatchDate = new Date(b.fixture.date);
              const aIsToday = format(aMatchDate, "yyyy-MM-dd") === todayDateString;
              const bIsToday = format(bMatchDate, "yyyy-MM-dd") === todayDateString;

              // NEW: Today's upcoming matches get highest priority (after live matches)
              const aTodayUpcoming = aIsToday && aUpcoming;
              const bTodayUpcoming = bIsToday && bUpcoming;

              // NEW: Check for today's ended matches
              const aTodayEnded = aIsToday && aEnded;
              const bTodayEnded = bIsToday && bEnded;

              // ENHANCED Primary sort: Live > Today's Ended > Recent Ended (48h) > Today's Upcoming > Other Ended > Other Upcoming
              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              // Calculate recency for ended matches
              const aIsRecentEnded = aEnded && !aTodayEnded && Math.abs((new Date(a.fixture.date).getTime() - now.getTime()) / (1000 * 60 * 60)) <= 48;
              const bIsRecentEnded = bEnded && !bTodayEnded && Math.abs((new Date(b.fixture.date).getTime() - now.getTime()) / (1000 * 60 * 60)) <= 48;

              // If both are live, continue to secondary sorting
              if (aLive && bLive) {
                // Continue to secondary sorting below
              }
              // Today's ended matches get priority after live matches
              else if (aTodayEnded && !bTodayEnded) return -1;
              else if (!aTodayEnded && bTodayEnded) return 1;
              // Recent ended matches (within 48 hours) get priority after today's ended matches
              else if (aIsRecentEnded && !bIsRecentEnded && !aTodayEnded && !bTodayEnded) return -1;
              else if (!aIsRecentEnded && bIsRecentEnded && !aTodayEnded && !bTodayEnded) return 1;
              // Today's upcoming matches get priority after recent ended matches
              else if (aTodayUpcoming && !bTodayUpcoming && !aTodayEnded && !bTodayEnded && !aIsRecentEnded && !bIsRecentEnded) return -1;
              else if (!aTodayUpcoming && bTodayUpcoming && !aTodayEnded && !bTodayEnded && !aIsRecentEnded && !bIsRecentEnded) return 1;
              // Other ended matches get priority after today's upcoming matches
              else if (aEnded && !bEnded && !aTodayUpcoming && !bTodayUpcoming && !aTodayEnded && !bTodayEnded && !aIsRecentEnded && !bIsRecentEnded) return -1;
              else if (!aEnded && bEnded && !aTodayUpcoming && !bTodayUpcoming && !aTodayEnded && !bTodayEnded && !aIsRecentEnded && !bIsRecentEnded) return 1;
              // Other upcoming matches come last
              else if (aUpcoming && !bUpcoming && !aEnded && !bEnded && !aTodayUpcoming && !bTodayUpcoming && !aTodayEnded && !bTodayEnded && !aIsRecentEnded && !bIsRecentEnded) return -1;
              else if (!aUpcoming && bUpcoming && !aEnded && !bEnded && !aTodayUpcoming && !bTodayUpcoming && !aTodayEnded && !bTodayEnded && !aIsRecentEnded && !bIsRecentEnded) return 1;

              // Within the same status category, apply additional sorting
              const aLeagueName = a.league.name?.toLowerCase() || "";
              const bLeagueName = b.league.name?.toLowerCase() || "";

              // Check for Friendlies Clubs vs FA Cup priority
              const aIsFriendliesClubs =
                aLeagueName.includes("friendlies clubs") || a.league.id === 667;
              const bIsFriendliesClubs =
                bLeagueName.includes("friendlies clubs") || b.league.id === 667;

              const aIsFACup =
                aLeagueName.includes("fa cup") || a.league.id === 45;
              const bIsFACup =
                bLeagueName.includes("fa cup") || b.league.id === 45;

              // Friendlies Clubs has priority over FA Cup
              if (aIsFriendliesClubs && bIsFACup) return -1;
              if (aIsFACup && bIsFriendliesClubs) return 1;

              // Priority leagues
              const aPriority = priorityLeagueIds.indexOf(a.league.id);
              const bPriority = priorityLeagueIds.indexOf(b.league.id);

              if (aPriority !== -1 && bPriority === -1) return -1;
              if (aPriority === -1 && bPriority !== -1) return 1;
              if (aPriority !== -1 && bPriority !== -1)
                return aPriority - bPriority;

              // Popular team friendlies get priority over regular matches
              const aIsPopularFriendly =
                (aLeagueName.includes("friendlies") ||
                  aLeagueName.includes("friendlies clubs") ||
                  a.league.id === 667) &&
                (POPULAR_TEAM_IDS.includes(a.teams.home.id) ||
                  POPULAR_TEAM_IDS.includes(a.teams.away.id));
              const bIsPopularFriendly =
                (bLeagueName.includes("friendlies") ||
                  bLeagueName.includes("friendlies clubs") ||
                  b.league.id === 667) &&
                (POPULAR_TEAM_IDS.includes(b.teams.home.id) ||
                  POPULAR_TEAM_IDS.includes(b.teams.away.id));

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

              // Finally sort by time based on status
              if (aLive && bLive) {
                // For live matches, sort by elapsed time (shortest first)
                const aElapsed = Number(a.fixture.status.elapsed) || 0;
                const bElapsed = Number(b.fixture.status.elapsed) || 0;
                return aElapsed - bElapsed;
              }

              if (aEnded && bEnded) {
                // For ended matches, sort by most recent first
                return (
                  new Date(b.fixture.date).getTime() -
                  new Date(a.fixture.date).getTime()
                );
              }

              if (aUpcoming && bUpcoming) {
                // For upcoming matches, sort by earliest first
                return (
                  new Date(a.fixture.date).getTime() -
                  new Date(b.fixture.date).getTime()
                );
              }

              // Default time sorting
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

  // Function to clear all related caches for excluded leagues
  const clearExcludedLeaguesCaches =useCallback(() => {
    try {
      // Clear fixture cache completely
      fixtureCache.clearCache();

      // Clear all localStorage entries that might contain excluded league data
      const keys = Object.keys(localStorage);
      const excludedLeagueKeys = keys.filter(
        (key) =>
          key.includes("848") || // UEFA Europa Conference League
          key.includes("169") || // Regionalliga - Bayern
          key.includes("180") || // National 2 - Group A
          key.includes("conference") ||
          key.includes("regionalliga") ||
          key.includes("bayern") ||
          key.includes("national 2") ||
          key.startsWith("ended_matches_") ||
          key.startsWith("league-fixtures-") ||
          key.startsWith("featured-match-") ||
          key.startsWith("all-fixtures-by-date") ||
          key.includes("62") || // Ligue 2
          key.includes("ligue 2") ||
          key.includes("l2"),
      );

      excludedLeagueKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clear cache key: ${key}`, error);
        }
      });

      // Clear sessionStorage as well
      const sessionKeys = Object.keys(sessionStorage);
      const sessionExcludedKeys = sessionKeys.filter(
        (key) =>
          key.includes("848") ||
          key.includes("169") ||
          key.includes("180") ||
          key.includes("conference") ||
          key.includes("regionalliga") ||
          key.includes("bayern") ||
          key.includes("national 2") ||
          key.startsWith("league-fixtures-") ||
          key.startsWith("featured-match-") ||
          key.includes("62") || // Ligue 2
          key.includes("ligue 2") ||
          key.includes("l2"),
      );

      sessionExcludedKeys.forEach((key) => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clear session cache key: ${key}`, error);
        }
      });

      // Also clear React Query cache for these specific leagues
      if (typeof window !== "undefined" && window.queryClient) {
        try {
          window.queryClient.removeQueries({
            predicate: (query: any) => {
              const key = query.queryKey?.join("-") || "";
              return (
                key.includes("848") ||
                key.includes("169") ||
                key.includes("180") ||
                key.includes("conference") ||
                key.includes("regionalliga") ||
                key.includes("bayern") ||
                key.includes("national 2") ||
                key.includes("62") || // Ligue 2
                key.includes("ligue 2") ||
                key.includes("l2")
              );
            },
          });
        } catch (error) {
          console.warn("Failed to clear React Query cache:", error);
        }
      }

      console.log(
        `🧹 [CacheClean] Cleared ${excludedLeagueKeys.length + sessionExcludedKeys.length} cache entries for excluded leagues (UEFA Europa Conference League, Regionalliga - Bayern, National 2 - Group A, Ligue 2)`,
      );
    } catch (error) {
      console.error("Error clearing excluded leagues caches:", error);
    }
  }, []);

  useEffect(() => {
    // Clear caches first to ensure we don't show stale data
    clearExcludedLeaguesCaches();

    // Initial fetch with force refresh after clearing caches
    setTimeout(() => {
      fetchFeaturedMatches(true);
    }, 100);
  }, []); // Only run once on mount

  // Use a ref for the interval timer to manage it across renders
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Optimized refresh strategy with selective updates
  useEffect(() => {
    if (featuredMatches.length === 0) return;

    const now = new Date();
    let refreshInterval = 900000; // Default: 15 minutes (reduced from 5 minutes)
    let shouldRefresh = false;

    // Analyze current match states - but with reduced full refresh needs
    const matchAnalysis = featuredMatches.reduce(
      (analysis, dayData) => {
        dayData.matches.forEach((match) => {
          const status = match.fixture.status.short;
          const matchDate = new Date(match.fixture.date);
          const minutesFromKickoff =
            (now.getTime() - matchDate.getTime()) / (1000 * 60);

          // Only count non-live matches for full refresh needs
          if (status === "NS") {
            if (Math.abs(minutesFromKickoff) <= 30) {
              analysis.imminentMatches++; // Starting within 30 minutes
            }

            // Check for stale "Starting now" matches
            if (minutesFromKickoff > 30 && minutesFromKickoff < 180) {
              analysis.staleMatches++;
            }
          }
        });
        return analysis;
      },
      {
        liveMatches: 0,
        imminentMatches: 0,
        upcomingMatches: 0,
        staleMatches: 0,
      },
    );

    // OPTIMIZED refresh strategy - selective updates handle live matches
    if (matchAnalysis.staleMatches > 0) {
      // Only refresh for stale matches that should have updated
      refreshInterval = 300000; // 5 minutes (reduced from 45 seconds)
      shouldRefresh = true;
      console.log(
        `🟡 [MyHomeFeaturedMatchNew] ${matchAnalysis.staleMatches} stale matches detected - using moderate refresh (5min)`,
      );
    } else if (matchAnalysis.imminentMatches > 0) {
      // Moderate refresh for imminent matches
      refreshInterval = 600000; // 10 minutes (reduced from 1 minute)
      shouldRefresh = true;
      console.log(
        `🟠 [MyHomeFeaturedMatchNew] ${matchAnalysis.imminentMatches} imminent matches - using moderate refresh (10min)`,
      );
    } else {
      // Standard: No urgent matches - selective updates handle live data
      refreshInterval = 900000; // 15 minutes
      shouldRefresh = false;
      console.log(
        `⏸️ [MyHomeFeaturedMatchNew] No urgent non-live matches - relying on selective updates for live data`,
      );
    }

    if (!shouldRefresh) {
      console.log(`⭕ [MyHomeFeaturedMatchNew] No full refresh needed - selective updates handling real-time data`);
      return;
    }

    const interval = setInterval(() => {
      console.log(
        `🔄 [MyHomeFeaturedMatchNew] Optimized refresh triggered (interval: ${refreshInterval / 1000}s) - selective updates handle live matches`,
      );
      fetchFeaturedMatches(false); // Background refresh without loading state
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [featuredMatches, fetchFeaturedMatches]);


  // Navigation handlers
  const handlePrevious = () => {
    if (allMatches.length <= 1) return;
    setCurrentMatchIndex(prev => (prev === 0 ? allMatches.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (allMatches.length <= 1) return;
    setCurrentMatchIndex(prev => (prev === allMatches.length - 1 ? 0 : prev + 1));
  };

  // Selective live updates for current match without full refresh
  useEffect(() => {
    if (!currentMatch || !currentMatch.fixture || !isLiveMatch(currentMatch.fixture.status.short)) {
      return;
    }

    console.log(`🎯 [MyHomeFeaturedMatchNew] Setting up selective updates for live match: ${currentMatch.fixture.id}`);

    // Use existing selective update system for live score updates
    const updateLiveMatch = async () => {
      try {
        const response = await fetch('/api/fixtures/live');
        const liveMatches = await response.json();
        const updatedMatch = liveMatches.find((match: any) => match.fixture.id === currentMatch.fixture.id);

        if (updatedMatch) {
          // Update only the current match in state without full refresh
          setFeaturedMatches(prev =>
            prev.map(dayData => ({
              ...dayData,
              matches: dayData.matches.map(match =>
                match.fixture.id === currentMatch.fixture.id ? updatedMatch : match
              )
            }))
          );
          console.log(`✅ [MyHomeFeaturedMatchNew] Updated live match ${currentMatch.fixture.id} without full refresh`);
        }
      } catch (error) {
        console.warn(`⚠️ [MyHomeFeaturedMatchNew] Selective update failed:`, error);
      }
    };

    // Update every 10 seconds for live matches only
    const liveUpdateInterval = setInterval(updateLiveMatch, 10000);

    return () => clearInterval(liveUpdateInterval);
  }, [currentMatch?.fixture.id, currentMatch?.fixture.status.short]);

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

    if (["LIVE", "LIV", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status)) {
      let displayText = status;

      if (status === "HT") {
        displayText = "Half Time";
      } else if (status === "1H" || status === "2H" || status === "LIVE" || status === "LIV") {
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
    return allMatches[currentMatchIndex] || null;
  }, [allMatches, currentMatchIndex]);

  // Fetch rounds data for current match league
  useEffect(() => {
    if (currentMatch?.league?.id && !roundsCache[`${currentMatch.league.id}-2025`]) {
      fetchRoundsForLeague(currentMatch.league.id, 2025);
    }
  }, [currentMatch, fetchRoundsForLeague, roundsCache]);

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
    if (currentMatch?.teams?.home && currentMatch?.teams?.away) {
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
    if (!currentMatch || !currentMatch.fixture) {
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
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4 overflow-hidden bg-white dark:bg-gray-800">
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
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
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
                    className="absolute -left-8 top-1/2 transform -translate-y-1/2 z-10 dark:bg-gray-700 dark:hover:bg-gray-800 hover:bg-gray-200 border-2 border-gray-400 rounded-full p-3 "
                  >
                    <ChevronLeft className="h-4 w-3 text-gray-500" />
                  </button>

                  <button
                    onClick={handleNext}
                    className="absolute -right-8 top-1/2 transform -translate-y-1/2 z-10 dark:bg-gray-700 dark:hover:bg-gray-800 hover:bg-gray-200 border-2 border-gray-400 rounded-full p-3 "
                  >
                    <ChevronRight className="h-4 w-3 text-gray-500" />
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
                      console.log(
                        `🔍 [FEATURED MATCH DEBUG] League ID Debug:`,
                        {
                          leagueId: currentMatch.league.id,
                          leagueName: currentMatch.league.name,
                          leagueCountry: currentMatch.league.country,
                          matchId: currentMatch.fixture.id,
                          homeTeam: currentMatch.teams.home.name,
                          awayTeam: currentMatch.teams.away.name,
                          fixtureStatus: currentMatch.fixture.status.short,
                        },
                      );

                      // Call onMatchSelect if provided (for Details tab)
                      if (onMatchSelect) {
                        console.log(
                          `🎯 [MyHomeFeaturedMatchNew] Selecting match for Details tab:`,
                          currentMatch.fixture.id,
                        );
                        onMatchSelect(currentMatch.fixture.id);
                      } else {
                        // Navigate to match details page if no callback provided
                        navigate(`/match/${currentMatch.fixture.id}`);
                      }
                    }}
                  >
                    {/* League header */}
                    <div
                      className="flex items-center justify-center gap-2 mb-4 p-2"
                      onClick={() =>
                        console.log(
                          `🔍 [LEAGUE HEADER DEBUG] Clicked on league:`,
                          {
                            LEAGUE_ID: currentMatch.league.id,
                            LEAGUE_NAME: currentMatch.league.name,
                            LEAGUE_COUNTRY: currentMatch.league.country,
                            LEAGUE_LOGO: currentMatch.league.logo,
                          },
                        )
                      }
                    >
                      <LazyImage
                        src={
                          currentMatch.league.name
                            ?.toLowerCase()
                            .includes("cotif")
                            ? "/assets/matchdetaillogo/SGCUNl9j-zkh3mv3i.png"
                            : currentMatch.league.logo
                        }
                        alt={currentMatch.league.name}
                        className="w-6 h-6"
                        fallbackSrc="/assets/fallback.png"
                      />
                      <span
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center"
                        title={`League ID: ${currentMatch.league.id} | ${currentMatch.league.name} | ${currentMatch.league.country}`}
                      >
                        {(() => {
                          // First try smart league translation
                          const smartTranslation =
                            smartLeagueCountryTranslation.translateLeagueName(
                              currentMatch.league.name,
                              currentLanguage,
                            );

                          // If smart translation worked (different from original), use it
                          if (smartTranslation !== currentMatch.league.name) {
                            console.log(
                              `🎯 [League Translation] Smart: "${currentMatch.league.name}" → "${smartTranslation}"`,
                            );
                            return smartTranslation;
                          }

                          // Fallback to context translation
                          const contextTranslation = translateLeagueName(
                            currentMatch.league.name,
                          );
                          console.log(
                            `🔄 [League Translation] Context: "${currentMatch.league.name}" → "${contextTranslation}"`,
                          );
                          return contextTranslation;
                        })()}
                      </span>

                      {/* Round/Bracket Status Display using RoundBadge component */}
                      <RoundBadge
                        leagueId={currentMatch.league.id}
                        currentRound={currentMatch.league?.round}
                        matchStatus={currentMatch.fixture.status.short}
                        className="ml-2"
                      />
                    </div>

                    {/* Match day indicator */}
                    <div className="text-center mb-4 ">
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200 ">
                        {(() => {
                          const statusInfo = getStatusDisplay(currentMatch);
                          const matchStatus = currentMatch.fixture.status.short;
                          const matchDate = new Date(currentMatch.fixture.date);
                          const today = new Date();
                          const tomorrow = addDays(today, 1);

                          const matchDateString = format(
                            matchDate,
                            "yyyy-MM-dd",
                          );
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
                                  {elapsed && (
                                    <span
                                      className="animate-pulse"
                                      style={{
                                        animation:
                                          "truePulse 2s infinite ease-in-out",
                                      }}
                                    >
                                      {" "}
                                      {elapsed}'
                                    </span>
                                  )}
                                  {!elapsed && (
                                    <span
                                      className="animate-pulse"
                                      style={{
                                        animation:
                                          "truePulse 2s infinite ease-in-out",
                                      }}
                                    >
                                      {getMatchStatusTranslation(
                                        "LIVE",
                                        currentLanguage,
                                      )}
                                    </span>
                                  )}
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
                                <div className="text-gray-600 dark:text-gray-400 text-sm ">
                                  {getMatchStatusTranslation(
                                    matchStatus,
                                    currentLanguage,
                                  )}
                                </div>
                                <div className="text-3xl font-bold">
                                  {homeScore} - {awayScore}
                                </div>
                                {/* Show penalty scores if match ended in penalties */}
                                {matchStatus === "PEN" &&
                                  currentMatch.score?.penalty && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {t("penalties")}:{" "}
                                      {currentMatch.score.penalty.home} -{" "}
                                      {currentMatch.score.penalty.away}
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
                              // Check if countdown shows "Starting now" and translate it
                              if (countdownTimer === "Starting now") {
                                return getMatchStatusTranslation(
                                  "NS",
                                  currentLanguage,
                                );
                              }
                              return countdownTimer;
                            }

                            // Fallback to date labeling with translations
                            if (matchDateString === todayString) {
                              return t("today");
                            } else if (matchDateString === tomorrowString) {
                              return t("tomorrow") || "Tomorrow";
                            } else {
                              // Calculate days difference for upcoming matches using date-only comparison
                              const matchDateOnly = new Date(
                                matchDate.getFullYear(),
                                matchDate.getMonth(),
                                matchDate.getDate(),
                              );
                              const todayDateOnly = new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate(),
                              );
                              const daysDiff = Math.round(
                                (matchDateOnly.getTime() -
                                  todayDateOnly.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );

                              if (daysDiff > 0 && daysDiff <= 7) {
                                // For matches within a week, show just the number of days with translation
                                const dayText =
                                  daysDiff === 1
                                    ? t("day") !== "day"
                                      ? t("day")
                                      : "Day"
                                    : t("days") !== "days"
                                      ? t("days")
                                      : "Days";
                                return `${daysDiff} ${dayText}`;
                              } else if (daysDiff > 7) {
                                // For matches more than a week away, show translated date
                                const dayName = format(matchDate, "EEEE");
                                const monthName = format(matchDate, "MMMM");
                                const dayNumber = format(matchDate, "do");

                                const translatedDayName = (() => {
                                  const dayKey = dayName.toLowerCase();
                                  return t(dayKey) !== dayKey
                                    ? t(dayKey)
                                    : dayName;
                                })();

                                const translatedMonthName = (() => {
                                  const monthKey = monthName.toLowerCase();
                                  return t(monthKey) !== monthKey
                                    ? t(monthKey)
                                    : monthName;
                                })();

                                return `${translatedDayName}, ${dayNumber} ${translatedMonthName}`;
                              } else {
                                // For past matches that aren't ended (edge case)
                                const dayName = format(matchDate, "EEEE");
                                const monthName = format(matchDate, "MMM");
                                const dayNumber = format(matchDate, "d");

                                const translatedDayName = (() => {
                                  const dayKey = dayName.toLowerCase();
                                  return t(dayKey) !== dayKey
                                    ? t(dayKey)
                                    : dayName;
                                })();

                                const translatedMonthName = (() => {
                                  const monthKey = monthName.toLowerCase();
                                  return t(monthKey) !== monthKey
                                    ? t(monthKey)
                                    : monthName;
                                })();

                                return `${translatedDayName}, ${translatedMonthName} ${dayNumber}`;
                              }
                            }
                          })();

                          return (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600 dark:text-gray-400 invisible">
                                {/* // Hidden status placeholder to maintain spacing */}
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
                            className="h-full w-[calc(50%+20px)] ml-[25px] transition-all duration-500 ease-in-out opacity-100 relative "
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
                                  top: "calc(50% - 35px)",
                                  left: "-35px",
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
                                  size="70px"
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
                            className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px] font-sans"
                            style={{
                              top: "calc(50% - 13px)",
                              left: "80px",
                              fontSize: "clamp(12px, 2.5vw, 16px)",
                              fontWeight: "normal",
                            }}
                          >
                            {(() => {
                              const originalName =
                                currentMatch?.teams?.home?.name || "TBD";
                              return translateTeamName(originalName);
                            })()}
                          </div>

                          {/* VS circle */}
                          <div
                            className="absolute text-white font-md text-3xl  h-[52px] w-[52px] flex items-center justify-center z-30 overflow-hidden"
                            style={{
                              background: "transparent",
                              left: "calc(50% - 35px)",
                              top: "calc(50% - 26px)",
                              minWidth: "52px",
                            }}
                          >
                            <span className="vs-text font-bold">VS</span>
                          </div>

                          {/* Match date and venue - centered below VS */}
                          <div
                            className=" absolute text-center text-xs text-black dark:text-gray-300 font-medium"
                            style={{
                              fontSize: "0.875rem",
                              whiteSpace: "nowrap",
                              overflow: "visible",
                              textAlign: "center",
                              position: "absolute",
                              left: "50%",
                              transform: "translateX(-50%)",

                              bottom: "-70px",
                              width: "max-content",
                              fontFamily: "'Inter', system-ui, sans-serif",
                            }}
                          >
                            {(() => {
                              try {
                                const matchDate = new Date(
                                  currentMatch.fixture.date,
                                );
                                const statusInfo =
                                  getStatusDisplay(currentMatch);

                                // Get day name and translate it
                                const dayName = format(matchDate, "EEEE");
                                const translatedDayName = (() => {
                                  const dayKey = dayName.toLowerCase();
                                  return t(dayKey) !== dayKey
                                    ? t(dayKey)
                                    : dayName;
                                })();

                                // Get month name and translate it
                                const monthName = format(matchDate, "MMMM");
                                const translatedMonthName = (() => {
                                  const monthKey = monthName.toLowerCase();
                                  return t(monthKey) !== monthKey
                                    ? t(monthKey)
                                    : monthName;
                                })();

                                // Get day number with ordinal
                                const dayNumber = format(matchDate, "do");
                                const timeOnly = format(matchDate, "HH:mm");

                                // Build translated date string
                                const translatedDate = `${translatedDayName}, ${dayNumber} ${translatedMonthName}`;

                                // Safely get venue with proper fallbacks - SHOW FOR ALL MATCH TYPES
                                let displayVenue =
                                  currentMatch.fixture?.venue?.name ||
                                  currentMatch.venue?.name ||
                                  null;

                                // Check if venue is missing or has placeholder values
                                if (
                                  !displayVenue ||
                                  displayVenue === "TBD" ||
                                  displayVenue === "Venue TBA" ||
                                  displayVenue === "" ||
                                  displayVenue === "Unknown" ||
                                  displayVenue === "null" ||
                                  displayVenue.trim() === ""
                                ) {
                                  displayVenue = null; // No valid venue found
                                }

                                // Format venue name with proper capitalization
                                const formattedVenue = displayVenue
                                  ? displayVenue
                                      .toLowerCase()
                                      .replace(/\b\w/g, (l) => l.toUpperCase())
                                  : null;

                                // Show date, time, and venue for ALL match types (upcoming, live, ended)
                                return (
                                  <>
                                    {translatedDate} | {timeOnly}
                                    {formattedVenue
                                      ? ` | ${formattedVenue}`
                                      : ""}
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
                            className="h-full w-[calc(50%+16px)] mr-[45px] transition-all duration-500 ease-in-out opacity-100"
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
                              top: "calc(50% - 13px)",
                              right: "85px",
                              fontSize: "clamp(12px, 2.5vw, 16px)",
                              fontWeight: "normal",
                            }}
                          >
                            {(() => {
                              const originalName =
                                currentMatch?.teams?.away?.name || "Away Team";
                              return translateTeamName(originalName);
                            })()}
                          </div>

                          <div
                            className="absolute z-20 w-[64px] h-[64px] transition-all duration-300 ease-in-out"
                            style={{
                              cursor: "pointer",
                              top: "calc(50% - 38px)",
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
                                  ? `/api/team-logo/square/${currentMatch.teams.away.id}?size=70`
                                  : currentMatch?.teams?.away?.logo ||
                                    `/assets/fallback-logo.svg`
                              }
                              alt={
                                currentMatch?.teams?.away?.name || "Away Team"
                              }
                              size="75px"
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
                    <div className="flex justify-around border-t border-gray-200 dark:border-gray-700 pt-4 mt-20">
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
                        <span className="text-xs text-gray-600 dark:text-white mt-1">
                          {t("match_page") || "Match Page"}
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
                        <span className="text-xs text-gray-600 dark:text-white mt-1">
                          {t("lineups") || "Lineups"}
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
                        <span className="text-xs text-gray-600 dark:text-white mt-1">
                          {t("statistics") || "Stats"}
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
                            d="M4 6H6V8H4V6ZM4 11H6V13H4V11ZM4 16H6V18H4V16ZM20 8V6H8.023V8H18.8H20ZM8 11H20V13H8V11ZM8 16H20V18H8V16Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="text-xs text-gray-600 dark:text-white mt-1">
                          {t("groups") || "Groups"}
                        </span>
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
                            className={`w-1 h-1 rounded-sm transition-colors ${
                              index === currentMatchIndex
                                ? "bg-gray-500"
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