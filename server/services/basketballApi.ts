
import axios from "axios";

interface BasketballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: any;
  week: any;
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

interface BasketballPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  birth: {
    date: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
}

interface BasketballPlayerStatistics {
  player: BasketballPlayer;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    type: string;
    season: number;
    logo: string;
  };
  games: {
    appearences: number;
    lineups: number;
    minutes: string;
    position: string;
  };
  points: number;
  pos: string;
  min: string;
  fgm: number;
  fga: number;
  fgp: string;
  ftm: number;
  fta: number;
  ftp: string;
  tpm: number;
  tpa: number;
  tpp: string;
  offReb: number;
  defReb: number;
  totReb: number;
  assists: number;
  pFouls: number;
  steals: number;
  turnovers: number;
  blocks: number;
  plusMinus: string;
}

interface BasketballApiResponse {
  get: string;
  parameters: any;
  errors: any[];
  results: number;
  response: any[];
}

// Initialize Basketball API client with direct API-Football.com headers
const apiKey = process.env.API_FOOTBALL_BASKETBALL_KEY || "81bc62b91b1190622beda24ee23fbd1a";

const basketballApiClient = axios.create({
  baseURL: "https://v1.basketball.api-sports.io",
  headers: {
    "x-apisports-key": apiKey, // Direct API-Football.com header
  },
  timeout: 15000, // 15 second timeout
});

// Add request interceptor for logging
basketballApiClient.interceptors.request.use(
  (config) => {
    console.log(`🏀 [BasketballAPI] Making request: ${config.method?.toUpperCase()} ${config.url}`, config.params);
    return config;
  },
  (error) => {
    console.error('🏀 [BasketballAPI] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
basketballApiClient.interceptors.response.use(
  (response) => {
    console.log(`🏀 [BasketballAPI] Response: ${response.status} - ${response.data?.results || 0} results`);
    return response;
  },
  (error) => {
    console.error('🏀 [BasketballAPI] Response error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Cache configuration
const BASKETBALL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for basketball games
const basketballCache = new Map<string, { data: any; timestamp: number }>();

export const basketballApiService = {
  /**
   * Get basketball games by date
   */
  async getGamesByDate(date: string): Promise<BasketballGame[]> {
    const cacheKey = `basketball-games-${date}`;
    const cached = basketballCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < BASKETBALL_CACHE_DURATION) {
      console.log(`📦 [BasketballAPI] Using cached games for ${date}`);
      return cached.data;
    }

    try {
      console.log(`🏀 [BasketballAPI] Fetching games for date: ${date}`);

      const response = await basketballApiClient.get("/games", {
        params: {
          date: date,
        },
      });

      console.log(`🏀 [BasketballAPI] API response status: ${response.status}, results: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        const games = response.data.response;

        // Filter out invalid games
        const validGames = games.filter((game: BasketballGame) => {
          return (
            game &&
            game.teams &&
            game.teams.home &&
            game.teams.away &&
            game.teams.home.name &&
            game.teams.away.name &&
            game.league &&
            game.league.name
          );
        });

        basketballCache.set(cacheKey, {
          data: validGames,
          timestamp: now,
        });

        console.log(`✅ [BasketballAPI] Retrieved ${validGames.length} valid games for ${date}`);
        return validGames;
      }

      console.log(`❌ [BasketballAPI] No games data for ${date}`);
      return [];
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching games for ${date}:`, error);

      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }

      return [];
    }
  },

  /**
   * Get basketball games by league
   */
  async getGamesByLeague(leagueId: number, season: string): Promise<BasketballGame[]> {
    const cacheKey = `basketball-league-${leagueId}-${season}`;
    const cached = basketballCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < BASKETBALL_CACHE_DURATION) {
      console.log(`📦 [BasketballAPI] Using cached league games for ${leagueId}`);
      return cached.data;
    }

    try {
      console.log(`🏀 [BasketballAPI] Fetching games for league: ${leagueId}, season: ${season}`);

      const response = await basketballApiClient.get("/games", {
        params: {
          league: leagueId,
          season: season,
        },
      });

      if (response.data && response.data.response) {
        const games = response.data.response;
        basketballCache.set(cacheKey, {
          data: games,
          timestamp: now,
        });

        console.log(`✅ [BasketballAPI] Retrieved ${games.length} games for league ${leagueId}`);
        return games;
      }

      return [];
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching league ${leagueId} games:`, error);

      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }

      return [];
    }
  },

  /**
   * Get live basketball games
   */
  async getLiveGames(): Promise<BasketballGame[]> {
    try {
      console.log(`🔴 [BasketballAPI] Fetching live games...`);

      const response = await basketballApiClient.get("/games", {
        params: {
          live: "all",
        },
      });

      if (response.data && response.data.response) {
        const liveGames = response.data.response;
        console.log(`🔴 [BasketballAPI] Retrieved ${liveGames.length} live games`);
        return liveGames;
      }

      return [];
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching live games:`, error);
      return [];
    }
  },

  /**
   * Get basketball player statistics from specific games (top scorers)
   */
  async getTopScorers(leagueId: number, season: string) {
    try {
      console.log(`🏀 [BasketballAPI] Fetching top scorers for league ${leagueId}, season ${season}`);

      // Step 1: First get recent games for this league
      const recentGames = await this.getGamesByLeague(leagueId, season);
      
      if (!recentGames || recentGames.length === 0) {
        console.warn(`⚠️ [BasketballAPI] No games found for league ${leagueId}`);
        throw new Error(`No games available for league ${leagueId}`);
      }

      console.log(`🏀 [BasketballAPI] Found ${recentGames.length} games for league ${leagueId}`);

      // Step 2: Get player statistics from multiple recent games
      const allPlayerStats: any[] = [];
      const maxGamesToCheck = Math.min(10, recentGames.length); // Check up to 10 recent games

      for (let i = 0; i < maxGamesToCheck; i++) {
        const game = recentGames[i];
        try {
          console.log(`🏀 [BasketballAPI] Fetching player stats for game ${game.id}`);
          
          const response = await basketballApiClient.get("/games/statistics/players", {
            params: {
              id: game.id
            }
          });

          if (response.data && response.data.response && response.data.response.length > 0) {
            const gamePlayerStats = response.data.response;
            console.log(`🏀 [BasketballAPI] Retrieved ${gamePlayerStats.length} player stats for game ${game.id}`);
            
            // Add game info to each player stat
            gamePlayerStats.forEach((playerStat: any) => {
              if (playerStat.points && playerStat.points > 0) {
                allPlayerStats.push({
                  ...playerStat,
                  gameId: game.id,
                  gameDate: game.date
                });
              }
            });
          }
        } catch (gameError) {
          console.warn(`⚠️ [BasketballAPI] Failed to get stats for game ${game.id}:`, gameError);
          continue; // Skip this game and try the next one
        }
      }

      if (allPlayerStats.length === 0) {
        console.warn(`⚠️ [BasketballAPI] No player statistics found across ${maxGamesToCheck} games`);
        throw new Error(`No player statistics available for league ${leagueId} games`);
      }

      // Step 3: Aggregate and sort players by total points
      const playerAggregation = new Map();
      
      allPlayerStats.forEach((playerStat: any) => {
        const playerId = playerStat.player?.id;
        if (!playerId) return;

        if (playerAggregation.has(playerId)) {
          const existing = playerAggregation.get(playerId);
          existing.totalPoints += playerStat.points || 0;
          existing.gamesPlayed += 1;
        } else {
          playerAggregation.set(playerId, {
            player: playerStat.player,
            team: playerStat.team,
            totalPoints: playerStat.points || 0,
            gamesPlayed: 1,
            lastGameStats: playerStat
          });
        }
      });

      // Step 4: Convert to top scorers format and sort
      const topScorers = Array.from(playerAggregation.values())
        .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
        .slice(0, 10)
        .map((playerData: any) => ({
          player: {
            id: playerData.player?.id || 0,
            name: playerData.player?.name || 'Unknown Player',
            photo: playerData.player?.photo || `https://media.api-sports.io/basketball/players/${playerData.player?.id}.png`
          },
          statistics: [{
            team: {
              id: playerData.team?.id || 0,
              name: playerData.team?.name || 'Unknown Team',
              logo: playerData.team?.logo || `https://media.api-sports.io/basketball/teams/${playerData.team?.id}.png`
            },
            league: {
              id: leagueId,
              name: 'Basketball League',
              season: parseInt(season.split('-')[0])
            },
            games: {
              appearences: playerData.gamesPlayed,
              position: playerData.lastGameStats?.pos || 'Player'
            },
            goals: { 
              total: playerData.totalPoints  // Total points across games
            }
          }]
        }));

      console.log(`✅ [BasketballAPI] Retrieved ${topScorers.length} real top scorers from ${maxGamesToCheck} games for league ${leagueId}`);
      return topScorers;
      
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching top scorers for league ${leagueId}:`, error);
      throw error; // Re-throw to prevent fallback to mock data
    }
  }
};
