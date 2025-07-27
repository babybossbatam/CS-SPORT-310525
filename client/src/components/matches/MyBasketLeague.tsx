
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { ChevronDown, ChevronUp, Trophy, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "../../lib/MyPopularLeagueExclusion";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { format, parseISO } from "date-fns";

interface BasketballGame {
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

interface MyBasketLeagueProps {
  selectedDate: string;
  timeFilterActive: boolean;
  showTop10?: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
  useUTCOnly?: boolean;
}

export const MyBasketLeague: React.FC<MyBasketLeagueProps> = ({
  selectedDate,
  timeFilterActive = false,
  showTop10 = false,
  liveFilterActive = false,
  onMatchCardClick,
  useUTCOnly = true,
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(new Set());

  // Popular basketball leagues configuration (matching other basketball components)
  const popularBasketballLeagueIds = [
    12, // NBA
    13, // WNBA
    120, // EuroLeague
    117, // CBA (China) - from MyBasketPopularLeagues
    121, // Liga ACB (Spain)
    122, // Lega Basket Serie A (Italy)  
    123, // Bundesliga (Germany)
    124, // LNB Pro A (France)
  ];

  // Fetch basketball games for the selected date
  const basketballQuery = useQuery({
    queryKey: ["basketball-games", selectedDate],
    queryFn: async () => {
      console.log(`🏀 [MyBasketLeague] Fetching basketball games for ${selectedDate} from basketball API`);
      
      try {
        const response = await fetch(`/api/basketball/games/date/${selectedDate}`);
        if (!response.ok) {
          console.error(`🏀 [MyBasketLeague] API error: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const games = await response.json();
        
        console.log(`🏀 [MyBasketLeague] Retrieved ${games.length} basketball games for ${selectedDate}`);
        console.log(`🏀 [MyBasketLeague] API Response sample:`, games.slice(0, 2));
        return games as BasketballGame[];
      } catch (error) {
        console.error(`🏀 [MyBasketLeague] Error fetching basketball games for ${selectedDate}:`, error);
        console.error(`🏀 [MyBasketLeague] API endpoint: /api/basketball/games/date/${selectedDate}`);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: basketballGames = [], isLoading } = basketballQuery;

  // Process and group games by league
  const processedLeagues = useMemo(() => {
    if (!basketballGames || basketballGames.length === 0) return [];

    // Group games by league
    const gamesByLeague = basketballGames.reduce((acc, game) => {
      const leagueId = game.league.id;
      
      if (!acc[leagueId]) {
        acc[leagueId] = {
          leagueId,
          leagueInfo: game.league,
          countryInfo: game.country,
          games: [],
        };
      }
      
      acc[leagueId].games.push(game);
      return acc;
    }, {} as Record<number, any>);

    return Object.values(gamesByLeague)
      .filter((league: any) => {
        // Apply basic filtering if needed
        return league.games.length > 0;
      })
      .sort((a: any, b: any) => {
        // Sort by number of games (more games first)
        return b.games.length - a.games.length;
      })
      .slice(0, showTop10 ? 10 : undefined); // Limit to top 10 if requested
  }, [basketballGames, showTop10]);

  const toggleLeague = (leagueId: number) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueId)) {
      newExpanded.delete(leagueId);
    } else {
      newExpanded.add(leagueId);
    }
    setExpandedLeagues(newExpanded);
  };

  // Auto-expand leagues with live games or few games
  useEffect(() => {
    const leaguesToExpand = new Set<number>();

    processedLeagues.forEach((league) => {
      const hasLiveGames = league.games.some((game: BasketballGame) =>
        game.status?.short === "LIVE" ||
        game.status?.short === "1Q" ||
        game.status?.short === "2Q" ||
        game.status?.short === "3Q" ||
        game.status?.short === "4Q" ||
        game.status?.short === "HT"
      );

      // Expand if has live games or is a major league with few games
      if (hasLiveGames || league.games.length <= 4) {
        leaguesToExpand.add(league.leagueId);
      }
    });

    setExpandedLeagues(leaguesToExpand);
  }, [processedLeagues]);

  const handleMatchCardClick = (game: BasketballGame) => {
    console.log('🏀 [MyBasketLeague] Basketball game clicked:', {
      gameId: game.id,
      teams: `${game.teams?.home?.name} vs ${game.teams?.away?.name}`,
      league: game.league?.name,
      country: game.country?.name,
      status: game.status?.short,
      source: 'MyBasketLeague'
    });
    onMatchCardClick?.(game);
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading basketball leagues...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processedLeagues.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No basketball games found</h3>
            <p className="text-sm">No games available for the selected date in basketball leagues.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {processedLeagues.map((league) => {
        const isExpanded = expandedLeagues.has(league.leagueId);
        const liveGameCount = league.games.filter((game: BasketballGame) =>
          game.status?.short === "LIVE" ||
          game.status?.short === "1Q" ||
          game.status?.short === "2Q" ||
          game.status?.short === "3Q" ||
          game.status?.short === "4Q" ||
          game.status?.short === "HT"
        ).length;

        return (
          <Card key={league.leagueId} className="shadow-md">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 py-3"
              onClick={() => toggleLeague(league.leagueId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MyCircularFlag
                      countryName={league.countryInfo.name}
                      size={20}
                      className="flex-shrink-0"
                    />
                    <LazyImage
                      src={league.leagueInfo.logo}
                      alt={league.leagueInfo.name}
                      className="w-5 h-5 object-contain flex-shrink-0"
                      fallbackSrc="/assets/fallback-logo.png"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-gray-900 truncate block">
                      {league.leagueInfo.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate block">
                      {league.countryInfo.name} • {league.leagueInfo.season}
                    </span>
                  </div>
                  {liveGameCount > 0 && (
                    <div className="flex items-center gap-1 ml-2">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </div>
                      <span className="text-xs text-orange-600 font-medium">
                        {liveGameCount} LIVE
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{league.games.length} games</span>
                  <div className={`transform transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </div>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {league.games.map((game: BasketballGame) => (
                    <div
                      key={game.id}
                      className="match-card-container group cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      onClick={() => handleMatchCardClick(game)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Teams and Score */}
                        <div className="flex items-center gap-3 flex-1">
                          {/* Home Team */}
                          <div className="flex items-center gap-2 flex-1">
                            <LazyImage
                              src={game.teams.home.logo}
                              alt={game.teams.home.name}
                              className="w-6 h-6 object-contain"
                              fallbackSrc="/assets/fallback-logo.png"
                            />
                            <span className="text-sm font-medium truncate">
                              {game.teams.home.name}
                            </span>
                          </div>

                          {/* Score/Status */}
                          <div className="flex items-center gap-2 px-3">
                            {game.status?.short === "NS" ? (
                              <span className="text-xs text-gray-500">
                                {new Date(game.date).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold">
                                  {game.scores?.home?.total || 0}
                                </span>
                                <span className="text-gray-400">-</span>
                                <span className="text-sm font-bold">
                                  {game.scores?.away?.total || 0}
                                </span>
                              </div>
                            )}
                            
                            {/* Live indicator */}
                            {(["LIVE", "1Q", "2Q", "3Q", "4Q", "HT"].includes(game.status?.short)) && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-orange-600 font-medium">
                                  {game.status?.short}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span className="text-sm font-medium truncate">
                              {game.teams.away.name}
                            </span>
                            <LazyImage
                              src={game.teams.away.logo}
                              alt={game.teams.away.name}
                              className="w-6 h-6 object-contain"
                              fallbackSrc="/assets/fallback-logo.png"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default MyBasketLeague;
