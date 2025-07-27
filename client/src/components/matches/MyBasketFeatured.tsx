
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
import LazyImage from "../common/LazyImage";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import {
  getTeamColor,
  getEnhancedHomeTeamGradient,
} from "@/lib/colorExtractor";
import { motion, AnimatePresence } from "framer-motion";

import { RoundBadge } from "@/components/ui/round-badge";

// Popular basketball teams data
const POPULAR_BASKETBALL_TEAMS_DATA = [
  { id: 145, name: 'Los Angeles Lakers', country: 'USA' },
  { id: 149, name: 'Golden State Warriors', country: 'USA' },
  { id: 150, name: 'Boston Celtics', country: 'USA' },
  { id: 155, name: 'Chicago Bulls', country: 'USA' },
  { id: 142, name: 'Miami Heat', country: 'USA' },
  { id: 1313, name: 'Real Madrid', country: 'Spain' },
  { id: 1314, name: 'FC Barcelona', country: 'Spain' },
  { id: 1329, name: 'Panathinaikos', country: 'Greece' },
  { id: 1343, name: 'Fenerbahçe', country: 'Turkey' },
  { id: 1377, name: 'CSKA Moscow', country: 'Russia' }
];

const POPULAR_BASKETBALL_TEAM_IDS = POPULAR_BASKETBALL_TEAMS_DATA.map(team => team.id);
const POPULAR_BASKETBALL_TEAM_NAMES = POPULAR_BASKETBALL_TEAMS_DATA.map(team => team.name.toLowerCase());

// Popular basketball team keywords for enhanced matching
const POPULAR_BASKETBALL_TEAM_KEYWORDS = [
  "lakers", "warriors", "celtics", "bulls", "heat", "real madrid", "barcelona", 
  "panathinaikos", "fenerbahce", "cska", "euroleague", "nba"
];

// Helper function to check if a basketball match involves popular teams
const isPopularBasketballTeamMatch = (homeTeam: string, awayTeam: string, homeTeamId?: number, awayTeamId?: number): boolean => {
  // First check by team ID (most accurate)
  if (homeTeamId && awayTeamId) {
    const hasPopularTeamById = POPULAR_BASKETBALL_TEAM_IDS.includes(homeTeamId) || POPULAR_BASKETBALL_TEAM_IDS.includes(awayTeamId);
    if (hasPopularTeamById) {
      return true;
    }
  }

  // Fallback to name matching
  const homeTeamLower = homeTeam.toLowerCase();
  const awayTeamLower = awayTeam.toLowerCase();

  const hasPopularTeamByName = POPULAR_BASKETBALL_TEAM_NAMES.some(popularTeam => 
    homeTeamLower.includes(popularTeam) || awayTeamLower.includes(popularTeam)
  );

  if (hasPopularTeamByName) {
    return true;
  }

  // Enhanced keyword-based matching
  const hasKeywordMatch = POPULAR_BASKETBALL_TEAM_KEYWORDS.some(keyword => 
    homeTeamLower.includes(keyword) || awayTeamLower.includes(keyword)
  );

  return hasKeywordMatch;
};
interface MyBasketFeaturedProps {
  selectedDate?: string;
  maxMatches?: number;
}

// Popular basketball leagues
const POPULAR_BASKETBALL_LEAGUES = [
  { id: 12, name: "NBA", country: "USA" },
  { id: 120, name: "EuroLeague", country: "Europe" },
  { id: 127, name: "Liga ACB", country: "Spain" },
  { id: 133, name: "Lega Basket Serie A", country: "Italy" },
  { id: 132, name: "Bundesliga", country: "Germany" },
  { id: 134, name: "LNB Pro A", country: "France" },
  { id: 122, name: "EuroCup", country: "Europe" },
  { id: 117, name: "CBA", country: "China" },
];

// Define featured basketball leagues
const FEATURED_BASKETBALL_LEAGUE_IDS = [
  12, 120, 127, 133, 132, 134, 122, 117
];

const PRIORITY_BASKETBALL_LEAGUE_IDS = [12, 120, 122]; // NBA, EuroLeague, EuroCup

interface FeaturedBasketballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  status: {
    long: string;
    short: string;
    timer: string;
  };
  league: {
    id: number;
    name: string;
    type: string;
    season: string;
    logo: string;
  };
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
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
  scores: {
    home: {
      quarter_1: number;
      quarter_2: number;
      quarter_3: number;
      quarter_4: number;
      over_time: number;
      total: number;
    };
    away: {
      quarter_1: number;
      quarter_2: number;
      quarter_3: number;
      quarter_4: number;
      over_time: number;
      total: number;
    };
  };
}

interface DayMatches {
  date: string;
  label: string;
  matches: FeaturedBasketballGame[];
}

const MyBasketFeatured: React.FC<MyBasketFeaturedProps> = ({
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
      const response = await fetch(`/api/basketball/leagues/${leagueId}/rounds?season=${season}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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

        // Use priority basketball leagues
        const priorityLeagueIds = PRIORITY_BASKETBALL_LEAGUE_IDS;
        const allGames: FeaturedBasketballGame[] = [];

        console.log(
          "🏀 [MyBasketFeatured] Starting fetch with priority basketball leagues:",
          priorityLeagueIds,
        );
        console.log(
          "🏀 [MyBasketFeatured] All featured basketball league IDs:",
          FEATURED_BASKETBALL_LEAGUE_IDS,
        );

        // Helper function to determine if basketball game is live
        const isLiveBasketballGame = (status: string) => {
          return ["LIVE", "Q1", "Q2", "Q3", "Q4", "OT", "HT"].includes(
            status,
          );
        };

        // Helper function to determine if basketball game is ended
        const isEndedBasketballGame = (status: string) => {
          return [
            "FT",
            "AOT",
            "CANC",
            "SUSP",
            "AWD",
            "WO"
          ].includes(status);
        };

        // Helper function to determine if basketball game is upcoming
        const isUpcomingBasketballGame = (status: string) => {
          return ["NS", "TBD", "PST"].includes(status);
        };

        // Simple validation for basketball games
        const isValidBasketballGame = (game: any) => {
          return !!(game?.teams?.home?.name && game?.teams?.away?.name);
        };

        // Fetch live basketball games from API for real-time updates
        let liveGames: FeaturedBasketballGame[] = [];
        try {
          if (forceRefresh) {
            console.log(
              "🔴 [MyBasketFeatured] Fetching live basketball games",
            );
            const liveResponse = await fetch("/api/basketball/live");
            const liveData = await liveResponse.json();

            if (Array.isArray(liveData)) {
              console.log(
                "🏀 [MyBasketFeatured] Processing live basketball games:",
                liveData.length,
              );

              // Filter by featured basketball leagues
              const featuredLiveGames = liveData.filter((game) =>
                FEATURED_BASKETBALL_LEAGUE_IDS.includes(game.league?.id),
              );

              console.log(
                "🏀 [MyBasketFeatured] Featured live basketball games:",
                featuredLiveGames.length,
              );

              liveGames = featuredLiveGames
                .filter((game: any) => {
                  const isValid = isValidBasketballGame(game);
                  if (!isValid) {
                    console.log(
                      "❌ [MyBasketFeatured] Filtered out invalid basketball game:",
                      {
                        home: game.teams?.home?.name,
                        away: game.teams?.away?.name,
                        league: game.league?.name,
                      },
                    );
                  } else {
                    console.log(
                      "✅ [MyBasketFeatured] Valid featured live basketball game:",
                      {
                        home: game.teams?.home?.name,
                        away: game.teams?.away?.name,
                        league: game.league?.name,
                        leagueId: game.league?.id,
                      },
                    );
                  }
                  return isValid;
                });
            }
            console.log(
              `✅ [MyBasketFeatured] Found ${liveGames.length} live basketball games`,
            );
          }
        } catch (error) {
          console.error(
            "❌ [MyBasketFeatured] Error fetching live basketball games:",
            error,
          );
        }

        allGames.push(...liveGames);

        // Fetch basketball games from API for each date
        for (const dateInfo of dates) {
          try {
            console.log(
              `🏀 [MyBasketFeatured] Fetching basketball games for ${dateInfo.label}: ${dateInfo.date}`,
            );

            const response = await fetch(`/api/basketball/games/date/${dateInfo.date}`);
            if (!response.ok) {
              console.warn(`Basketball API returned ${response.status} for ${dateInfo.date}`);
              continue;
            }
            
            const games = await response.json();

            if (games?.length) {
              const validGames = games
                .filter((game: any) => {
                  // Must have valid teams
                  const hasValidTeams = isValidBasketballGame(game);
                  
                  // Filter by featured leagues
                  const isFeaturedLeague = FEATURED_BASKETBALL_LEAGUE_IDS.includes(game.league?.id);
                  
                  // Check if involves popular teams
                  const isPopularTeamGame = isPopularBasketballTeamMatch(
                    game.teams?.home?.name || "",
                    game.teams?.away?.name || "",
                    game.teams?.home?.id,
                    game.teams?.away?.id
                  );

                  const shouldInclude = hasValidTeams && (isFeaturedLeague || isPopularTeamGame);

                  if (shouldInclude) {
                    console.log(
                      `✅ [MyBasketFeatured] Including basketball game:`,
                      {
                        home: game.teams?.home?.name,
                        away: game.teams?.away?.name,
                        league: game.league?.name,
                        status: game.status?.short,
                      },
                    );
                  }

                  return shouldInclude;
                });

              allGames.push(...validGames);
            }
          } catch (error) {
            console.error(
              `❌ [MyBasketFeatured] Error fetching basketball games for ${dateInfo.label}:`,
              error,
            );
          }
        }

        // For basketball, we primarily rely on live data and API fetching
        // No need for extensive cached fixture data like football
        console.log(
          `🏀 [MyBasketFeatured] Basketball games collected from API: ${allGames.length}`,
        );

          // Basketball doesn't have friendlies like football
          console.log(
            `🏀 [MyBasketFeatured] Skipping friendlies - not applicable for basketball`,
          );

          }

        // Basketball games are ready for processing
        console.log(`🏀 [MyBasketFeatured] Total basketball games ready for display: ${allGames.length}`);

        // Remove duplicates based on game ID
        const uniqueGames = allGames.filter(
          (game, index, self) =>
            index ===
            self.findIndex((g) => g.id === game.id),
        );

        console.log(
          `🏀 [MyBasketFeatured] Total unique basketball games found:`,
          uniqueGames.length,
        );

        // Enhanced debug logging with league IDs
        const gameDetails = uniqueGames.map((g) => ({
          id: g.id,
          teams: `${g.teams.home.name} vs ${g.teams.away.name}`,
          league: g.league.name,
          leagueId: g.league.id,
          country: g.country.name,
          status: g.status.short,
          date: g.date,
        }));

        console.log(`🏀 [MyBasketFeatured] Basketball game details with League IDs:`, gameDetails);

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

        // Group basketball games by date
        const allMatches: DayMatches[] = [];
        for (const dateInfo of dates) {
          const gamesForDay = uniqueGames
            .filter((game) => {
              const gameDate = new Date(game.date);
              const year = gameDate.getFullYear();
              const month = String(gameDate.getMonth() + 1).padStart(2, "0");
              const day = String(gameDate.getDate()).padStart(2, "0");
              const gameDateString = `${year}-${month}-${day}`;
              return gameDateString === dateInfo.date;
            })
            .sort((a: FeaturedBasketballGame, b: FeaturedBasketballGame) => {
              // Priority sort: live matches first, then by league priority, then by time
              const aStatus = a.status.short;
              const bStatus = b.status.short;

              const aLive = isLiveBasketballGame(aStatus);
              const bLive = isLiveBasketballGame(bStatus);

              // Live matches always come first
              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              // Priority leagues first
              const aPriority = priorityLeagueIds.indexOf(a.league.id);
              const bPriority = priorityLeagueIds.indexOf(b.league.id);

              if (aPriority !== -1 && bPriority === -1) return -1;
              if (aPriority === -1 && bPriority !== -1) return 1;
              if (aPriority !== -1 && bPriority !== -1)
                return aPriority - bPriority;

              // Popular team games get priority
              const aIsPopularTeam = isPopularBasketballTeamMatch(
                a.teams.home.name,
                a.teams.away.name,
                a.teams.home.id,
                a.teams.away.id
              );
              const bIsPopularTeam = isPopularBasketballTeamMatch(
                b.teams.home.name,
                b.teams.away.name,
                b.teams.home.id,
                b.teams.away.id
              );

              if (aIsPopularTeam && !bIsPopularTeam) return -1;
              if (!aIsPopularTeam && bIsPopularTeam) return 1;

              // Finally by time
              return (
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
              );
            })
            .slice(0, Math.max(5, Math.floor(maxMatches / dates.length)));

          console.log(
            `✅ [MyBasketFeatured] Found ${gamesForDay.length} basketball games for ${dateInfo.label}`,
          );

          allMatches.push({
            date: dateInfo.date,
            label: dateInfo.label,
            matches: gamesForDay,
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
        console.error("❌ [MyBasketFeatured] Error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [maxMatches],
  );

  // Function to clear all related caches for excluded leagues
  const clearExcludedLeaguesCaches = useCallback(() => {
    try {
      // Clear fixture cache completely
      fixtureCache.clearCache();
      
      // Clear all localStorage entries that might contain excluded league data
      const keys = Object.keys(localStorage);
      const excludedLeagueKeys = keys.filter(key => 
        key.includes('848') || // UEFA Europa Conference League
        key.includes('169') || // Regionalliga - Bayern
        key.includes('conference') || 
        key.includes('regionalliga') ||
        key.includes('bayern') ||
        key.includes('fixtures_date') ||
        key.startsWith('finished_fixtures_') ||
        key.startsWith('league-fixtures-') ||
        key.startsWith('featured-match-') ||
        key.startsWith('all-fixtures-by-date')
      );
      
      excludedLeagueKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clear cache key: ${key}`, error);
        }
      });
      
      // Clear sessionStorage as well
      const sessionKeys = Object.keys(sessionStorage);
      const sessionExcludedKeys = sessionKeys.filter(key => 
        key.includes('848') || 
        key.includes('169') ||
        key.includes('conference') ||
        key.includes('regionalliga') ||
        key.includes('bayern') ||
        key.startsWith('league-fixtures-') ||
        key.startsWith('featured-match-')
      );
      
      sessionExcludedKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clear session cache key: ${key}`, error);
        }
      });
      
      // Also clear React Query cache for these specific leagues
      if (typeof window !== 'undefined' && window.queryClient) {
        try {
          window.queryClient.removeQueries({ 
            predicate: (query: any) => {
              const key = query.queryKey?.join('-') || '';
              return key.includes('848') || key.includes('169') || 
                     key.includes('conference') || key.includes('regionalliga') ||
                     key.includes('bayern');
            }
          });
        } catch (error) {
          console.warn('Failed to clear React Query cache:', error);
        }
      }
      
      console.log(`🧹 [CacheClean] Cleared ${excludedLeagueKeys.length + sessionExcludedKeys.length} cache entries for excluded leagues (UEFA Europa Conference League and Regionalliga - Bayern)`);
    } catch (error) {
      console.error('Error clearing excluded leagues caches:', error);
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
          "🔄 [MyBasketFeatured] Live matches detected, refreshing data",
        );
        fetchFeaturedMatches(false); // Background refresh without loading state
      } else {
        console.log(
          "⏸️ [MyBasketFeatured] No live matches, skipping refresh",
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

export default MyBasketFeatured;
