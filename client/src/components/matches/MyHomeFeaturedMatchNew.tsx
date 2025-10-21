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

import { RoundBadge } from "@/components/ui/round-badge";
import MatchCard from "./MatchCard";

// Global request cache for deduplication
const requestCache = new Map<string, Promise<any>>();
const requestTimestamps = new Map<string, number>();
const CACHE_DURATION = 30000; // 30 seconds

// Deduplication helper
const makeDedupedRequest = async (url: string, options = {}) => {
  const now = Date.now();
  const lastRequest = requestTimestamps.get(url);

  // If we have a cached request and it's still fresh, return it
  if (requestCache.has(url) && lastRequest && (now - lastRequest) < CACHE_DURATION) {
    console.log(`🔄 [Deduped] Using cached request for: ${url}`);
    return requestCache.get(url);
  }

  // Clear old cache entry if it exists
  if (requestCache.has(url)) {
    requestCache.delete(url);
    requestTimestamps.delete(url);
  }

  console.log(`🆕 [New Request] Making fresh request to: ${url}`);

  // Create new request and cache it
  const requestPromise = apiRequest("GET", url, options);
  requestCache.set(url, requestPromise);
  requestTimestamps.set(url, now);

  // Clean up cache after request completes
  requestPromise.finally(() => {
    setTimeout(() => {
      // Only delete if the timestamp matches the current one (prevents race conditions)
      if (requestTimestamps.get(url) === now) {
        requestCache.delete(url);
        requestTimestamps.delete(url);
      }
    }, CACHE_DURATION);
  });

  return requestPromise;
};

// Popular teams data from the same source as PopularTeamsList
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
  { id: 502, name: "Napoli", country: "Italy" },
  { id: 500, name: "AS Roma", country: "Italy" },
  { id: 505, name: "Lazio", country: "Italy" },
  { id: 1859, name: "Bayern München II", country: "Germany" },
  { id: 1860, name: "Borussia Dortmund II", country: "Germany" },
  { id: 8572, name: "Jong PSV", country: "Netherlands" },
  { id: 8564, name: "Jong Ajax", country: "Netherlands" },
];

// Elite teams for Champions League
const CHAMPIONS_LEAGUE_ELITE_TEAMS = [
  33, 40, 50, 42, 49, // Premier League elite
  541, 529, 548, // La Liga elite
  157, 165, 168, // Bundesliga elite
  489, 492, 496, 502, // Serie A elite
  81, // Ligue 1 elite
  610, 194, // Eredivisie elite
  211, 212, 228, // Primeira Liga elite
];

const POPULAR_TEAM_IDS = POPULAR_TEAMS_DATA.map((team) => team.id);
const POPULAR_TEAM_NAMES = POPULAR_TEAMS_DATA.map((team) =>
  team.name.toLowerCase(),
);

const POPULAR_TEAM_KEYWORDS = [
  "realmadrid", "barcelona", "manchestercity", "manchesterunited", "manchester",
  "bayernmunich", "bayern", "juventus", "psg", "paris saint-germain", "paris saint germain",
  "liverpool", "arsenal", "chelsea", "atleticomadrid", "atletico", "tottenham",
  "ac milan", "inter milan", "inter", "napoli", "roma", "as roma",
  "borussiadortmund", "borussia", "dortmund", "rbleipzig", "leipzig",
  "bayerleverkusen", "leverkusen", "lyon", "olympique lyonnais", "marseille",
  "olympique marseille", "monaco", "as monaco", "sevilla", "valencia", "villarreal",
  "ajax", "feyenoord", "psveindhoven", "psv", "porto", "fcporto", "benfica",
  "slbenfica", "sportingcp", "sportinglisbon", "sporting", "fenerbahce",
  "galatasaray", "besiktas", "trabzonspor", "millwall", "southampton", "elche",
  "valencia", "newcastle", "westham", "brighton", "brentford",
];

const isPopularTeamMatch = (
  homeTeam: string,
  awayTeam: string,
  homeTeamId?: number,
  awayTeamId?: number,
  leagueId?: number,
): boolean => {
  const isChampionsLeague = leagueId === 2;
  const popularIdsToCheck = isChampionsLeague
    ? CHAMPIONS_LEAGUE_ELITE_TEAMS
    : POPULAR_TEAM_IDS;

  if (homeTeamId && awayTeamId) {
    const hasPopularTeamById =
      popularIdsToCheck.includes(homeTeamId) ||
      popularIdsToCheck.includes(awayTeamId);
    if (hasPopularTeamById) {
      return true;
    }
  }

  const homeTeamLower = homeTeam.toLowerCase();
  const awayTeamLower = awayTeam.toLowerCase();

  const popularNamesToCheck = isChampionsLeague
    ? CHAMPIONS_LEAGUE_ELITE_TEAMS.map(
        (id) =>
          POPULAR_TEAMS_DATA.find((team) => team.id === id)?.name.toLowerCase(),
      ).filter(Boolean)
    : POPULAR_TEAM_NAMES;

  const hasPopularTeamByName = popularNamesToCheck.some(
    (popularTeam) =>
      homeTeamLower.includes(popularTeam!) ||
      awayTeamLower.includes(popularTeam!),
  );

  if (hasPopularTeamByName) {
    return true;
  }

  const hasKeywordMatch = POPULAR_TEAM_KEYWORDS.some(
    (keyword) =>
      homeTeamLower.includes(keyword) || awayTeamLower.includes(keyword),
  );

  return hasKeywordMatch;
};

interface MyHomeFeaturedMatchNewProps {
  selectedDate: string;
  maxMatches?: number;
  onMatchCardClick?: (fixture: any) => void;
}

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

const FEATURED_MATCH_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 2, 3, 5, 1, 4, 15, 38, 32, 850, 667, 9, 16, 45, 550, 531,
];

const EXPLICITLY_EXCLUDED_LEAGUE_IDS = [
  848, 169, 940, 85, 80, 84, 87, 86, 41, 772, 62, 931, 59, 60, 869, 180, 67, 68, 69,
];

const PRIORITY_LEAGUE_IDS = [39, 140, 78, 2, 15, 38, 32, 29, 850, 667, 22, 45, 550, 531];

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

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 6,
  onMatchCardClick,
}) => {
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
  const [fixturesByLeague, setFixturesByLeague] = useState<Record<number, FeaturedMatch[]>>({});
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [liveMatchData, setLiveMatchData] = useState<Map<number, Partial<FeaturedMatch>>>(new Map());

  const {
    translateTeamName,
    translateLeagueName,
    currentLanguage,
    getMatchStatusTranslation,
    learnFromFixtures,
  } = useLanguage();
  const { t } = useTranslation();

  const mountedRef = useRef(false);
  const selectiveUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const manageSelectiveUpdates = useCallback(() => {
    if (selectiveUpdateIntervalRef.current) {
      clearInterval(selectiveUpdateIntervalRef.current);
    }

    selectiveUpdateIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      setFeaturedMatches((prevMatches) => {
        const updatedMatches = prevMatches.map((dayData) => ({
          ...dayData,
          matches: dayData.matches.map((match) => {
            const status = match.fixture.status.short;
            const isLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);

            if (isLive) {
              // Using makeDedupedRequest for live match updates as well
              makeDedupedRequest(`/api/fixtures/${match.fixture.id}`)
                .then((res) => res.json())
                .then((data: Partial<FeaturedMatch>) => {
                  setLiveMatchData((prevData) => {
                    const newData = new Map(prevData);
                    newData.set(match.fixture.id, {
                      goals: data.goals,
                      fixture: {
                        ...match.fixture,
                        status: data.fixture?.status || match.fixture.status,
                      },
                    });
                    return newData;
                  });
                })
                .catch((error) => console.error("Error fetching live match data:", error));
            }
            return match;
          }),
        }));
        return updatedMatches;
      });
    }, 30000);
  }, []);

  const fetchRoundsForLeague = useCallback(
    async (leagueId: number, season: number) => {
      const cacheKey = `${leagueId}-${season}`;
      if (roundsCache[cacheKey]) {
        return roundsCache[cacheKey];
      }

      try {
        const response = await makeDedupedRequest(
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

    return hoursAgo > 2;
  }, []);

  const getCacheKey = useCallback((date: string, leagueId: number) => {
    return `ended_matches_${date}_${leagueId}`;
  }, []);

  const getCachedEndedMatches = useCallback(
    (date: string, leagueId: number): any[] => {
      try {
        const cacheKey = getCacheKey(date, leagueId);
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return [];

        const { fixtures, timestamp, date: cachedDate } = JSON.parse(cached);

        if (cachedDate !== date) {
          console.log(
            `🚨 [MyHomeFeaturedMatchNew] Date mismatch in cache - cached: ${cachedDate}, requested: ${date}, clearing cache`,
          );
          localStorage.removeItem(cacheKey);
          return [];
        }

        const cacheAge = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000;

        if (cacheAge < maxAge) {
          const validFixtures = fixtures.filter((fixture: any) =>
            isMatchOldEnded(fixture),
          );

          console.log(
            `✅ [MyHomeFeaturedMatchNew] Using cached ended matches for league ${leagueId} on ${date}: ${validFixtures.length} matches`,
          );
          return validFixtures;
        } else {
          localStorage.removeItem(cacheKey);
          console.log(
            `⏰ [MyHomeFeaturedMatchNew] Removed expired cache for league ${leagueId} on ${date} (age: ${Math.round(cacheAge / 60000)}min)`,
          );
        }
      } catch (error) {
        console.error("Error reading cached ended matches:", error);
        const cacheKey = getCacheKey(date, leagueId);
        localStorage.removeItem(cacheKey);
      }

      return [];
    },
    [getCacheKey, isMatchOldEnded],
  );

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
        if (forceRefresh || featuredMatches.length === 0) {
          setIsLoading(true);
        }

        const now = new Date();
        const shouldRefresh =
            forceRefresh ||
            featuredMatches.length === 0 ||
            featuredMatches.some((dayData) =>
              dayData.matches.some((match) => {
                const status = match.fixture.status.short;
                const matchDate = new Date(match.fixture.date);
                const minutesFromKickoff =
                  (now.getTime() - matchDate.getTime()) / (1000 * 60);
                const hoursFromKickoff = minutesFromKickoff / 60;

                const matchDateLocal = format(matchDate, "yyyy-MM-dd");
                const todayLocal = format(now, "yyyy-MM-dd");
                const isToday = matchDateLocal === todayLocal;

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

                const shouldHaveStarted = status === "NS" && minutesFromKickoff > 0;
                const isTodaysMatch = isToday;
                const isRecentlyEndedMatch =
                  ["FT", "AET", "PEN"].includes(status) &&
                  Math.abs(hoursFromKickoff) <= 24;
                const isUpcomingSoon =
                  status === "NS" && Math.abs(minutesFromKickoff) <= 120;

                const shouldRefreshMatch =
                  isLive ||
                  shouldHaveStarted ||
                  isTodaysMatch ||
                  isRecentlyEndedMatch ||
                  isUpcomingSoon;

                if (shouldRefreshMatch) {
                  console.log(
                    `🔄 [REFRESH TRIGGER] Match: ${match.teams.home.name} vs ${match.teams.away.name} (${status})`,
                  );
                }

                return shouldRefreshMatch;
              }),
            );

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

        const priorityLeagueIds = PRIORITY_LEAGUE_IDS;
        const allFixtures: FeaturedMatch[] = [];

        console.log(
          "🔍 [MyHomeFeaturedMatchNew] Starting PARALLEL fetch with priority leagues:",
          priorityLeagueIds,
        );

        const isLiveMatch = (status: string) => {
          return ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            status,
          );
        };

        const isValidMatch = (fixture: any) => {
          return !!(fixture?.teams?.home?.name && fixture?.teams?.away?.name);
        };

        // 🚀 PARALLEL FETCH - Fetch live matches
        let liveFixtures: FeaturedMatch[] = [];
        const livePromise = makeDedupedRequest("/api/featured-match/live?skipFilter=true")
          .then(async (response) => {
            const liveData = await response.json();

            if (Array.isArray(liveData)) {
              console.log("🔍 [MyHomeFeaturedMatchNew] Processing live fixtures:", liveData.length);

              const featuredLiveFixtures = liveData.filter((fixture) =>
                FEATURED_MATCH_LEAGUE_IDS.includes(fixture.league?.id),
              );

              liveFixtures = featuredLiveFixtures
                .filter((fixture: any) => {
                  const isValid = isValidMatch(fixture);
                  if (!isValid) {
                    console.log("❌ [MyHomeFeaturedMatchNew] Filtered out invalid fixture");
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
            console.log(`✅ [MyHomeFeaturedMatchNew] Found ${liveFixtures.length} live matches`);
          })
          .catch((error) => {
            console.error("❌ [MyHomeFeaturedMatchNew] Error fetching live matches:", error);
          });

        // 🚀 PARALLEL FETCH - Fetch all priority leagues in parallel
        const leaguePromises = priorityLeagueIds.map(async (leagueId) => {
          try {
            console.log(`🔍 [MyHomeFeaturedMatchNew] PARALLEL fetch for league ${leagueId}`);

            const response = await makeDedupedRequest(
              `/api/featured-match/leagues/${leagueId}/fixtures?skipFilter=true`,
            );
            const fixturesData = await response.json();

            if (Array.isArray(fixturesData)) {
              const cachedFixtures = fixturesData
                .filter((fixture: any) => {
                  const hasValidTeams = isValidMatch(fixture);
                  const isNotLive = !isLiveMatch(fixture.fixture.status.short);
                  const isOldEnded = isMatchOldEnded(fixture);

                  if (isOldEnded) {
                    return false;
                  }

                  const leagueName = fixture.league?.name?.toLowerCase() || "";
                  const isExplicitlyExcluded = EXPLICITLY_EXCLUDED_LEAGUE_IDS.includes(fixture.league?.id);

                  const isWomensCompetition = leagueName.includes("women");
                  const shouldInclude = hasValidTeams && isNotLive && !isWomensCompetition && !isExplicitlyExcluded;

                  if (shouldInclude) {
                    console.log(`✅ [PARALLEL] Including league ${leagueId} fixture`);
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

              return cachedFixtures;
            }
            return [];
          } catch (leagueError) {
            console.warn(`Failed to fetch league ${leagueId}:`, leagueError);
            return [];
          }
        });

        // 🚀 PARALLEL FETCH - Fetch date-based fixtures in parallel
        const datePromises = dates.map(async (dateInfo) => {
          try {
            console.log(`🔍 [PARALLEL] Fetching date fixtures for ${dateInfo.label}: ${dateInfo.date}`);

            const response = await makeDedupedRequest(
              `/api/featured-match/date/${dateInfo.date}?all=true&skipFilter=true`,
            );
            const fixtures = await response.json();

            if (Array.isArray(fixtures)) {
              const cachedFixtures = fixtures
                .filter((fixture: any) => {
                  const hasValidTeams = isValidMatch(fixture);
                  const isNotLive = !isLiveMatch(fixture.fixture.status.short);
                  const isNotPriorityLeague = !priorityLeagueIds.includes(fixture.league?.id);

                  const leagueName = fixture.league?.name?.toLowerCase() || "";
                  const country = fixture.league?.country?.toLowerCase() || "";

                  const isWomensCompetition = leagueName.includes("women");
                  const isPopularLeague = POPULAR_LEAGUES.some((league) => league.id === fixture.league?.id);
                  const isFromPopularCountry = POPULAR_LEAGUES.some((league) => league.country.toLowerCase() === country);
                  const isInternationalCompetition = leagueName.includes("champions league") ||
                    leagueName.includes("europa league") || leagueName.includes("uefa") ||
                    leagueName.includes("world cup") || country.includes("world") || country.includes("europe");

                  return (
                    hasValidTeams &&
                    isNotLive &&
                    isNotPriorityLeague &&
                    !isWomensCompetition &&
                    (isPopularLeague || isFromPopularCountry || isInternationalCompetition)
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

              return cachedFixtures;
            }
            return [];
          } catch (error) {
            console.error(`❌ [PARALLEL] Error fetching date fixtures for ${dateInfo.label}:`, error);
            return [];
          }
        });

        // 🚀 WAIT FOR ALL PARALLEL REQUESTS TO COMPLETE
        console.log("⏳ [PARALLEL] Waiting for all parallel requests to complete...");
        const [, leagueResults, dateResults] = await Promise.all([
          livePromise,
          Promise.all(leaguePromises),
          Promise.all(datePromises),
        ]);

        // Combine all results
        allFixtures.push(...liveFixtures);
        leagueResults.forEach(fixtures => allFixtures.push(...fixtures));
        dateResults.forEach(fixtures => allFixtures.push(...fixtures));

        // Remove duplicates
        const allUniqueFixtures = allFixtures.filter(
          (fixture, index, self) =>
            index === self.findIndex((f) => f.fixture.id === fixture.fixture.id),
        );

        console.log(`📋 [PARALLEL] Total unique fixtures found: ${allUniqueFixtures.length}`);

        try {
          learnFromFixtures(allUniqueFixtures);
          smartLeagueCountryTranslation.learnFromFixtures(allUniqueFixtures);
          console.log(`📚 [MyHomeFeaturedMatchNew] Learning completed from ${allUniqueFixtures.length} fixtures`);
        } catch (error) {
          console.warn("Error learning from fixtures:", error);
        }

        // Group fixtures by date
        const allMatches: DayMatches[] = [];
        const todayDateString = format(today, "yyyy-MM-dd");

        for (const dateInfo of dates) {
          const isToday = dateInfo.date === todayDateString;

          const fixturesForDay = allUniqueFixtures
            .filter((fixture) => {
              if (EXPLICITLY_EXCLUDED_LEAGUE_IDS.includes(fixture.league.id)) {
                console.log(`🚫 [EXPLICIT EXCLUSION] Match excluded: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                return false;
              }

              const status = fixture.fixture.status.short;
              const matchDate = new Date(fixture.fixture.date);
              const minutesFromKickoff = (now.getTime() - matchDate.getTime()) / (1000 * 60);

              if (status === "NS" && minutesFromKickoff > 120) {
                console.log(`🚫 [STALE MATCH EXCLUSION] Removing stale match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                return false;
              }

              if (["PST", "CANC", "SUSP", "ABD", "AWD", "WO"].includes(status)) {
                console.log(`🚫 [STATUS EXCLUSION] Removing ${status} match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                return false;
              }

              if (isToday) {
                if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                  console.log(`🔴 [TODAY'S LIVE MATCH INCLUSION] Including live match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                  return true;
                }

                if (["FT", "AET", "PEN"].includes(status)) {
                  const hoursAgo = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                  if (hoursAgo > 8) {
                    console.log(`🕐 [TODAY'S ENDED MATCH EXCLUSION] Removing match older than 8 hours`);
                    return false;
                  } else {
                    console.log(`✅ [TODAY'S ENDED MATCH INCLUSION] Including today's ended match`);
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
              const aStatus = a.fixture.status.short;
              const bStatus = b.fixture.status.short;

              const aLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
              const bLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              const aPriority = priorityLeagueIds.indexOf(a.league.id);
              const bPriority = priorityLeagueIds.indexOf(b.league.id);

              if (aPriority !== -1 && bPriority === -1) return -1;
              if (aPriority === -1 && bPriority !== -1) return 1;
              if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;

              // Sort by date within the same status and priority group
              return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
            })
            .slice(0, Math.max(5, Math.floor(maxMatches / dates.length)));

          console.log(`✅ [PARALLEL] Found ${fixturesForDay.length} featured matches for ${dateInfo.label}`);

          allMatches.push({
            date: dateInfo.date,
            label: dateInfo.label,
            matches: fixturesForDay,
          });
        }

        const uniqueFixtures = allMatches.reduce((acc, dayData) => {
          dayData.matches.forEach((match) => {
            if (!acc.some((existingMatch) => existingMatch.fixture.id === match.fixture.id)) {
              acc.push(match);
            }
          });
          return acc;
        }, [] as FeaturedMatch[]);

        const leagueMap: Record<number, FeaturedMatch[]> = {};
        uniqueFixtures.forEach((match) => {
          const leagueId = match.league.id;
          if (!leagueMap[leagueId]) {
            leagueMap[leagueId] = [];
          }
          leagueMap[leagueId].push(match);
        });
        setFixturesByLeague(leagueMap);

        setFeaturedMatches((prevMatches) => {
          const prevIds = prevMatches.flatMap(day => day.matches.map(m => m.fixture.id)).sort();
          const newIds = uniqueFixtures.map(m => m.fixture.id).sort();

          if (prevIds.join(',') !== newIds.join(',')) {
            console.log(`🔄 [PARALLEL] Match IDs changed, updating state`);
            setTimeout(() => manageSelectiveUpdates(), 100);
            return allMatches;
          }

          const hasStatusChanges = allMatches.some(dayData =>
            dayData.matches.some(match => {
              const prevMatch = prevMatches
                .flatMap(day => day.matches)
                .find(m => m.fixture.id === match.fixture.id);
              return prevMatch && (
                prevMatch.fixture.status.short !== match.fixture.status.short ||
                prevMatch.goals.home !== match.goals.home ||
                prevMatch.goals.away !== match.goals.away
              );
            })
          );

          if (hasStatusChanges) {
            console.log(`⚽ [PARALLEL] Match status/score changes detected, updating state`);
            setTimeout(() => manageSelectiveUpdates(), 100);
            return allMatches;
          }

          console.log(`✅ [PARALLEL] No changes detected, preserving existing state`);
          return prevMatches;
        });

      } catch (error) {
        console.error("❌ [PARALLEL] Error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [maxMatches, manageSelectiveUpdates, featuredMatches.length, learnFromFixtures, smartLeagueCountryTranslation, t, translateLeagueName, translateTeamName, getMatchStatusTranslation],
  );

  const clearExcludedLeaguesCaches = useCallback(() => {
    try {
      fixtureCache.clearCache();

      const keys = Object.keys(localStorage);
      const excludedLeagueKeys = keys.filter(
        (key) =>
          EXPLICITLY_EXCLUDED_LEAGUE_IDS.some(id => key.includes(String(id))) ||
          key.includes("conference") ||
          key.includes("regionalliga") ||
          key.includes("bayern") ||
          key.startsWith("ended_matches_") ||
          key.startsWith("featured-match-"),
      );

      excludedLeagueKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clear cache key: ${key}`, error);
        }
      });

      console.log(`🧹 [CacheClean] Cleared cache entries for excluded leagues`);
    } catch (error) {
      console.error("Error clearing excluded leagues caches:", error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    clearExcludedLeaguesCaches();

    const timer = setTimeout(() => {
      fetchFeaturedMatches(true);
    }, 2000); // Reduced from 5000ms to 2000ms since we're using parallel fetching

    if (featuredMatches.length > 0) {
      manageSelectiveUpdates();
    }

    return () => {
      mountedRef.current = false;
      if (selectiveUpdateIntervalRef.current) {
        clearInterval(selectiveUpdateIntervalRef.current);
        selectiveUpdateIntervalRef.current = null;
      }
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (featuredMatches.length === 0) return;

    const now = new Date();
    let refreshInterval = 300000;
    let shouldRefresh = false;

    const analysis = featuredMatches.reduce(
      (analysis, dayData) => {
        dayData.matches.forEach((match) => {
          const status = match.fixture.status.short;
          const matchDate = new Date(match.fixture.date);
          const minutesFromKickoff = (now.getTime() - matchDate.getTime()) / (1000 * 60);

          if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
            analysis.liveMatches++;
          } else if (status === "NS") {
            if (Math.abs(minutesFromKickoff) <= 30) {
              analysis.imminentMatches++;
            } else if (Math.abs(minutesFromKickoff) <= 120) {
              analysis.upcomingMatches++;
            }

            if (minutesFromKickoff > 5 && minutesFromKickoff < 180) {
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

    const todayEndedMatches = featuredMatches.reduce((count, dayData) => {
      return count + dayData.matches.filter(match => {
        const matchDate = new Date(match.fixture.date);
        const matchDateString = format(matchDate, "yyyy-MM-dd");
        const todayString = format(now, "yyyy-MM-dd");
        const isToday = matchDateString === todayString;
        const isEnded = ["FT", "AET", "PEN"].includes(match.fixture.status.short);
        return isToday && isEnded;
      }).length;
    }, 0);

    if (analysis.liveMatches > 0) {
      refreshInterval = 30000;
      shouldRefresh = true;
      console.log(`🔴 [PARALLEL] ${analysis.liveMatches} live matches - using optimized refresh (30s)`);
    } else if (todayEndedMatches > 0) {
      refreshInterval = 60000;
      shouldRefresh = true;
      console.log(`📊 [PARALLEL] ${todayEndedMatches} today's ended matches - using moderate refresh (1min)`);
    } else if (analysis.staleMatches > 0) {
      refreshInterval = 45000;
      shouldRefresh = true;
      console.log(`🟡 [PARALLEL] ${analysis.staleMatches} stale matches detected - using moderate refresh (45s)`);
    } else if (analysis.imminentMatches > 0) {
      refreshInterval = 120000;
      shouldRefresh = true;
      console.log(`🟠 [PARALLEL] ${analysis.imminentMatches} imminent matches - using balanced refresh (2min)`);
    } else if (analysis.upcomingMatches > 0) {
      refreshInterval = 180000;
      shouldRefresh = true;
      console.log(`🟢 [PARALLEL] ${analysis.upcomingMatches} upcoming matches - using standard refresh (3min)`);
    } else {
      refreshInterval = 600000;
      shouldRefresh = false;
      console.log(`⏸️ [PARALLEL] No urgent matches - using extended refresh (10min)`);
    }

    if (!shouldRefresh) {
      console.log(`⭕ [PARALLEL] No active refresh needed`);
      return;
    }

    const intervalId = setInterval(() => {
      console.log(`🔄 [PARALLEL] Smart refresh triggered (interval: ${refreshInterval / 1000}s)`);
      fetchFeaturedMatches(false);
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
      console.log(`🧹 [PARALLEL] Cleaned up refresh interval`);
    };
  }, [featuredMatches, fetchFeaturedMatches, manageSelectiveUpdates]);

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

  const allMatches = useMemo(() => {
    return featuredMatches.reduce((acc, dayData) => {
      return [...acc, ...dayData.matches];
    }, [] as FeaturedMatch[]);
  }, [featuredMatches]);

  const currentMatch = useMemo(() => {
    return allMatches[currentMatchIndex];
  }, [allMatches, currentMatchIndex]);

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

  const [teamLogoColors, setTeamLogoColors] = useState<Record<string, string>>({});

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
              resolve(getTeamColor(teamName, true));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const colorMap: Record<string, number> = {};

            for (let i = 0; i < data.length; i += 16) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              if (a < 128) continue;

              if ((r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) continue;

              const rGroup = Math.floor(r / 20) * 20;
              const gGroup = Math.floor(g / 20) * 20;
              const bGroup = Math.floor(b / 20) * 20;

              const colorKey = `${rGroup},${gGroup},${bGroup}`;
              colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
            }

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
              const enhancedR = Math.min(255, Math.max(40, r * 0.8));
              const enhancedG = Math.min(255, Math.max(40, g * 0.8));
              const enhancedB = Math.min(255, Math.max(40, b * 0.8));

              resolve(`rgb(${enhancedR}, ${enhancedG}, ${enhancedB})`);
            } else {
              resolve(getTeamColor(teamName, true));
            }
          };

          img.onerror = () => {
            resolve(getTeamColor(teamName, true));
          };

          img.src = logoUrl;
        });
      } catch (error) {
        console.warn("Error extracting color from logo:", error);
        return getTeamColor(teamName, true);
      }
    },
    [],
  );

  useEffect(() => {
    if (currentMatch?.teams) {
      const extractColors = async () => {
        const homeTeamName = currentMatch.teams.home.name;
        const awayTeamName = currentMatch.teams.away.name;

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

  useEffect(() => {
    if (!currentMatch) {
      setCountdownTimer("--:--:--");
      return;
    }

    const statusInfo = getStatusDisplay(currentMatch);

    if (!statusInfo.isUpcoming) {
      setCountdownTimer("");
      return;
    }

    function updateTimer() {
      try {
        const targetDate = parseISO(currentMatch.fixture.date);
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();

        if (diff <= 0) {
          setCountdownTimer("Starting now");
          return;
        }

        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (totalHours > 12) {
          setCountdownTimer("");
          return;
        }

        if (totalHours > 99) {
          const days = Math.floor(totalHours / 24);
          const remainingHours = totalHours % 24;
          setCountdownTimer(`${days}d ${remainingHours}h`);
        } else {
          const formattedHours = totalHours.toString().padStart(2, "0");
          const formattedMinutes = minutes.toString().padStart(2, "0");
          const formattedSeconds = seconds.toString().padStart(2, "0");

          setCountdownTimer(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
        }
      } catch (error) {
        console.error("Error calculating countdown:", error);
        setCountdownTimer("--:--:--");
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentMatch]);

  const getEnhancedTeamColor = useCallback(
    (teamName: string, isHome: boolean = false) => {
      const extractedColor = teamLogoColors[teamName];
      if (extractedColor) {
        return extractedColor;
      }
      return getTeamColor(teamName, isHome);
    },
    [teamLogoColors, getTeamColor],
  );

  const handleMatchClick = useCallback((fixture: FeaturedMatch) => {
    if (onMatchCardClick) {
      console.log(`🎯 [MyHomeFeaturedMatchNew] Selecting match for Details tab:`, fixture.fixture.id);
      onMatchCardClick(fixture);
    } else {
      navigate(`/match/${fixture.fixture.id}`);
    }
  }, [navigate, onMatchCardClick]);

  const toggleStar = useCallback((matchId: number) => {
    setStarredMatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  }, []);

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
            <div className="text-center">
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto" />
            </div>

            <div className="relative mt-4">
              <div className="flex relative h-[53px] rounded-md mb-8">
                <div className="w-full h-full flex justify-between relative">
                  <div className="flex items-center w-[45%]">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 ml-4" />
                  </div>

                  <div className="flex items-center justify-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>

                  <div className="flex items-center justify-end w-[45%]">
                    <Skeleton className="h-6 w-24 mr-4" />
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>

            <div className="flex justify-around border-t border-gray-200 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-5 w-5 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

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

              <AnimatePresence mode="wait">
                {currentMatch && (
                  <motion.div
                    key={`match-${currentMatch.fixture.id}-${currentMatch.fixture.status.short}`}
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
                      console.log(`🔍 [FEATURED MATCH DEBUG] League ID Debug:`, {
                        leagueId: currentMatch.league.id,
                        leagueName: currentMatch.league.name,
                        leagueCountry: currentMatch.league.country,
                        matchId: currentMatch.fixture.id,
                        homeTeam: currentMatch.teams.home.name,
                        awayTeam: currentMatch.teams.away.name,
                        fixtureStatus: currentMatch.fixture.status.short,
                      });

                      handleMatchClick(currentMatch);
                    }}
                  >
                    <div
                      className="flex items-center justify-center gap-2 mb-4 p-2"
                      onClick={() => {
                        console.log(`🔍 [LEAGUE HEADER DEBUG] Clicked on league:`, {
                          LEAGUE_ID: currentMatch.league.id,
                          LEAGUE_NAME: currentMatch.league.name,
                          LEAGUE_COUNTRY: currentMatch.league.country,
                          LEAGUE_LOGO: currentMatch.league.logo,
                        });
                      }}
                    >
                      <LazyImage
                        src={
                          currentMatch.league.name?.toLowerCase().includes("cotif")
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
                          const smartTranslation = smartLeagueCountryTranslation.translateLeagueName(
                            currentMatch.league.name,
                            currentLanguage,
                          );

                          if (smartTranslation !== currentMatch.league.name) {
                            console.log(`🎯 [League Translation] Smart: "${currentMatch.league.name}" → "${smartTranslation}"`);
                            return smartTranslation;
                          }

                          const contextTranslation = translateLeagueName(currentMatch.league.name);
                          console.log(`🔄 [League Translation] Context: "${currentMatch.league.name}" → "${contextTranslation}"`);
                          return contextTranslation;
                        })()}
                      </span>

                      <RoundBadge
                        leagueId={currentMatch.league.id}
                        currentRound={currentMatch.league?.round}
                        matchStatus={currentMatch.fixture.status.short}
                        className="ml-2"
                      />
                    </div>

                    <div className="text-center mb-4 ">
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200 ">
                        {(() => {
                          const statusInfo = getStatusDisplay(currentMatch);
                          const matchStatus = currentMatch.fixture.status.short;
                          const matchDate = new Date(currentMatch.fixture.date);
                          const today = new Date();
                          const tomorrow = addDays(today, 1);

                          const matchDateString = format(matchDate, "yyyy-MM-dd");
                          const todayString = format(today, "yyyy-MM-dd");
                          const tomorrowString = format(tomorrow, "yyyy-MM-dd");

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
                                        animation: "truePulse 2s infinite ease-in-out",
                                      }}
                                    >
                                      {elapsed}'
                                    </span>
                                  )}
                                  {!elapsed && (
                                    <span
                                      className="animate-pulse"
                                      style={{
                                        animation: "truePulse 2s infinite ease-in-out",
                                      }}
                                    >
                                      {getMatchStatusTranslation("LIVE", currentLanguage)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-2xl font-md">
                                  {homeScore} - {awayScore}
                                </div>
                              </div>
                            );
                          }

                          if (matchStatus === "FT" || matchStatus === "AET" || matchStatus === "PEN") {
                            const homeScore = currentMatch.goals.home ?? 0;
                            const awayScore = currentMatch.goals.away ?? 0;

                            return (
                              <div className="space-y-0">
                                <div className="text-gray-600 dark:text-gray-400 text-sm ">
                                  {getMatchStatusTranslation(matchStatus, currentLanguage)}
                                </div>
                                <div className="text-3xl font-bold">
                                  {homeScore} - {awayScore}
                                </div>
                                {matchStatus === "PEN" && currentMatch.score?.penalty && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {t("penalties")}: {currentMatch.score.penalty.home} - {currentMatch.score.penalty.away}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          const upcomingContent = (() => {
                            if (countdownTimer && countdownTimer !== "" && countdownTimer !== "Loading..." && countdownTimer !== "--:--:--") {
                              if (countdownTimer === "Starting now") {
                                return getMatchStatusTranslation("NS", currentLanguage);
                              }
                              return countdownTimer;
                            }

                            if (matchDateString === todayString) {
                              return t("today");
                            } else if (matchDateString === tomorrowString) {
                              return t("tomorrow") || "Tomorrow";
                            } else {
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
                                (matchDateOnly.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24),
                              );

                              if (daysDiff > 0 && daysDiff <= 7) {
                                const dayText = daysDiff === 1 ?
                                  (t("day") !== "day" ? t("day") : "Day") :
                                  (t("days") !== "days" ? t("days") : "Days");
                                return `${daysDiff} ${dayText}`;
                              } else if (daysDiff > 7) {
                                const dayName = format(matchDate, "EEEE");
                                const monthName = format(matchDate, "MMMM");
                                const dayNumber = format(matchDate, "do");

                                const translatedDayName = (() => {
                                  const dayKey = dayName.toLowerCase();
                                  return t(dayKey) !== dayKey ? t(dayKey) : dayName;
                                })();

                                const translatedMonthName = (() => {
                                  const monthKey = monthName.toLowerCase();
                                  return t(monthKey) !== monthKey ? t(monthKey) : monthName;
                                })();

                                return `${translatedDayName}, ${dayNumber} ${translatedMonthName}`;
                              } else {
                                const dayName = format(matchDate, "EEEE");
                                const monthName = format(matchDate, "MMM");
                                const dayNumber = format(matchDate, "d");

                                const translatedDayName = (() => {
                                  const dayKey = dayName.toLowerCase();
                                  return t(dayKey) !== dayKey ? t(dayKey) : dayName;
                                })();

                                const translatedMonthName = (() => {
                                  const monthKey = monthName.toLowerCase();
                                  return t(monthKey) !== monthKey ? t(monthKey) : monthName;
                                })();

                                return `${translatedDayName}, ${translatedMonthName} ${dayNumber}`;
                              }
                            }
                          })();

                          return (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600 dark:text-gray-400 invisible">
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

                    <div className="relative mt-2">
                      <div
                        className="flex relative h-[53px] rounded-md mb-8"
                        onClick={() => navigate(`/match/${currentMatch.fixture.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="w-full h-full flex justify-between relative">
                          <div
                            className="h-full w-[calc(50%+20px)] ml-[25px] transition-all duration-500 ease-in-out opacity-100 relative "
                            style={{
                              background: getEnhancedTeamColor(
                                currentMatch?.teams?.home?.name || "Home Team",
                                true,
                              ),
                              transition: "all 0.3s ease-in-out",
                              clipPath: "polygon(0 0, 100% 0, 100% 100%, 100% 100%, 100%)",
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
                                  teamName={currentMatch.teams.home.name || "Home Team"}
                                  teamLogo={
                                    currentMatch.teams.home.id
                                      ? `/api/team-logo/square/${currentMatch.teams.home.id}?size=64`
                                      : currentMatch.teams.home.logo || "/assets/fallback-logo.svg"
                                  }
                                  alt={currentMatch.teams.home.name || "Home Team"}
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
                                const matchDate = new Date(currentMatch.fixture.date);
                                const statusInfo = getStatusDisplay(currentMatch);

                                const dayName = format(matchDate, "EEEE");
                                const translatedDayName = (() => {
                                  const dayKey = dayName.toLowerCase();
                                  return t(dayKey) !== dayKey ? t(dayKey) : dayName;
                                })();

                                const monthName = format(matchDate, "MMMM");
                                const translatedMonthName = (() => {
                                  const monthKey = monthName.toLowerCase();
                                  return t(monthKey) !== monthKey ? t(monthKey) : monthName;
                                })();

                                const dayNumber = format(matchDate, "do");
                                const timeOnly = format(matchDate, "HH:mm");

                                const translatedDate = `${translatedDayName}, ${dayNumber} ${translatedMonthName}`;

                                let displayVenue = currentMatch.fixture?.venue?.name ||
                                  currentMatch.venue?.name || null;

                                if (!displayVenue || displayVenue === "TBD" || displayVenue === "Venue TBA" ||
                                  displayVenue === "" || displayVenue === "Unknown" || displayVenue === "null" ||
                                  displayVenue.trim() === "") {
                                  displayVenue = null;
                                }

                                const formattedVenue = displayVenue
                                  ? displayVenue.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
                                  : null;

                                return (
                                  <>
                                    {translatedDate} | {timeOnly}
                                    {formattedVenue ? ` | ${formattedVenue}` : ""}
                                  </>
                                );
                              } catch (e) {
                                console.warn("Error formatting match date/venue:", e);
                                return "Match details unavailable";
                              }
                            })()}
                          </div>

                          <div
                            className="h-full w-[calc(50%+16px)] mr-[45px] transition-all duration-500 ease-in-out opacity-100"
                            style={{
                              background: getEnhancedTeamColor(
                                currentMatch?.teams?.away?.name || "Away Team",
                                false,
                              ),
                              transition: "all 0.3s ease-in-out",
                              clipPath: "polygon(15px 0, 100% 0, 100% 100%, 0 100%)",
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
                              const originalName = currentMatch?.teams?.away?.name || "Away Team";
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
                              teamName={currentMatch?.teams?.away?.name || "Away Team"}
                              teamLogo={
                                currentMatch.teams.away.id
                                  ? `/api/team-logo/square/${currentMatch.teams.away.id}?size=70`
                                  : currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`
                              }
                              alt={currentMatch?.teams?.away?.name || "Away Team"}
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

                    <div className="flex justify-around border-t border-gray-200 dark:border-gray-700 pt-4 mt-20">
                      <button
                        className="flex flex-col items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/match/${currentMatch.fixture.id}`);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
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
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
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
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
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
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
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
                              index === currentMatchIndex ? "bg-gray-500" : "bg-gray-300"
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