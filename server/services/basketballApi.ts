
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

interface BasketballPlayerStats {
  game: {
    id: number;
  };
  team: {
    id: number;
  };
  player: {
    id: number;
    name: string;
  };
  type: string; // "starters" or "bench"
  minutes: string;
  field_goals: {
    total: number;
    attempts: number;
    percentage: number | null;
  };
  threepoint_goals: {
    total: number;
    attempts: number;
    percentage: number | null;
  };
  freethrows_goals: {
    total: number;
    attempts: number;
    percentage: number | null;
  };
  rebounds: {
    total: number;
  };
  assists: number;
  points: number;
}

interface BasketballApiResponse {
  get: string;
  parameters: any;
  errors: any[];
  results: number;
  response: any[];
}

// Initialize Basketball API client for API-Football.com
const apiKey = "81bc62b91b1190622beda24ee23fbd1a";

const basketballApiClient = axios.create({
  baseURL: "https://v1.basketball.api-sports.io",
  headers: {
    "x-apisports-key": apiKey,
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
    
    // Log detailed response for debugging
    if (response.data) {
      console.log(`🔍 [BasketballAPI] Full Response Structure:`, {
        url: response.config?.url,
        params: response.config?.params,
        status: response.status,
        results: response.data?.results,
        errors: response.data?.errors,
        responseKeys: Object.keys(response.data),
        sampleData: response.data?.response ? response.data.response.slice(0, 1) : null
      });
      
      // Log the complete raw response for debugging
      console.log(`🔍 [BasketballAPI] Raw Response Data:`, JSON.stringify(response.data, null, 2));
    }
    
    return response;
  },
  (error) => {
    console.error('🏀 [BasketballAPI] Response error:', error.response?.status, error.response?.data || error.message);
    
    // Log full error details
    if (error.response) {
      console.log(`🔍 [BasketballAPI] Error Details:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url,
        params: error.config?.params
      });
      
      // Log raw error response
      console.log(`🔍 [BasketballAPI] Raw Error Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return Promise.reject(error);
  }
);

// Cache configuration
const BASKETBALL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for basketball games
const basketballCache = new Map<string, { data: any; timestamp: number }>();

export const basketballApiService = {
  // Expose the API client for direct testing
  basketballApiClient,
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
   * Get basketball player statistics from specific games (for top scorers)
   */
  async getTopScorers(leagueId: number, season: string) {
    try {
      console.log(`🏀 [BasketballAPI] Fetching top scorers for league ${leagueId}, season ${season}`);

      // Step 1: Get recent games for this league
      const recentGames = await this.getGamesByLeague(leagueId, season);
      
      if (!recentGames || recentGames.length === 0) {
        console.warn(`⚠️ [BasketballAPI] No games found for league ${leagueId}`);
        throw new Error(`No games available for league ${leagueId}`);
      }

      console.log(`🏀 [BasketballAPI] Found ${recentGames.length} games for league ${leagueId}`);

      // Step 2: Get player statistics from multiple recent games
      const allPlayerStats: BasketballPlayerStats[] = [];
      const maxGamesToCheck = Math.min(20, recentGames.length); // Check up to 20 recent games

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
            const gamePlayerStats = response.data.response as BasketballPlayerStats[];
            console.log(`🏀 [BasketballAPI] Retrieved ${gamePlayerStats.length} player stats for game ${game.id}`);
            
            // Add valid player stats
            gamePlayerStats.forEach((playerStat: BasketballPlayerStats) => {
              if (playerStat.points && playerStat.points > 0) {
                allPlayerStats.push(playerStat);
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
      
      allPlayerStats.forEach((playerStat: BasketballPlayerStats) => {
        const playerId = playerStat.player?.id;
        if (!playerId) return;

        if (playerAggregation.has(playerId)) {
          const existing = playerAggregation.get(playerId);
          existing.totalPoints += playerStat.points || 0;
          existing.gamesPlayed += 1;
          existing.totalRebounds += playerStat.rebounds?.total || 0;
          existing.totalAssists += playerStat.assists || 0;
        } else {
          playerAggregation.set(playerId, {
            player: playerStat.player,
            team: playerStat.team,
            totalPoints: playerStat.points || 0,
            totalRebounds: playerStat.rebounds?.total || 0,
            totalAssists: playerStat.assists || 0,
            gamesPlayed: 1,
            lastGameStats: playerStat
          });
        }
      });

      // Step 4: Convert to top scorers format and sort by total points
      const topScorers = Array.from(playerAggregation.values())
        .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
        .slice(0, 10)
        .map((playerData: any) => ({
          player: {
            id: playerData.player?.id || 0,
            name: playerData.player?.name || 'Unknown Player',
            photo: `https://media.api-sports.io/basketball/players/${playerData.player?.id}.png`
          },
          statistics: [{
            team: {
              id: playerData.team?.id || 0,
              name: playerData.team?.name || 'Unknown Team',
              logo: `https://media.api-sports.io/basketball/teams/${playerData.team?.id}.png`
            },
            league: {
              id: leagueId,
              name: 'Basketball League',
              season: parseInt(season.split('-')[0])
            },
            games: {
              appearences: playerData.gamesPlayed,
              position: 'Player' // Basketball API doesn't provide position in player stats
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
  },

  /**
   * Get basketball leagues
   */
  async getLeagues(): Promise<any[]> {
    try {
      console.log(`🏀 [BasketballAPI] Fetching basketball leagues...`);

      const response = await basketballApiClient.get("/leagues");

      console.log(`🔍 [BasketballAPI] Raw leagues response:`, {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        results: response.data?.results,
        errors: response.data?.errors,
        sampleLeague: response.data?.response?.[0]
      });

      if (response.data && response.data.response) {
        const leagues = response.data.response;
        console.log(`🏀 [BasketballAPI] Retrieved ${leagues.length} leagues`);
        
        // Log some sample leagues for reference
        console.log(`🔍 [BasketballAPI] Sample leagues:`, leagues.slice(0, 5).map(league => ({
          id: league.id,
          name: league.name,
          country: league.country?.name,
          season: league.seasons?.[0]
        })));
        
        return leagues;
      }

      return [];
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching leagues:`, error);
      return [];
    }
  },

  /**
   * Test API connection and headers
   */
  async testConnection(): Promise<any> {
    try {
      console.log(`🧪 [BasketballAPI] Testing API connection...`);
      
      const response = await basketballApiClient.get("/leagues", {
        params: { current: true }
      });

      console.log(`🧪 [BasketballAPI] Connection test result:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataStructure: {
          hasGet: !!response.data?.get,
          hasParameters: !!response.data?.parameters,
          hasErrors: !!response.data?.errors,
          hasResults: !!response.data?.results,
          hasResponse: !!response.data?.response,
          errorsArray: response.data?.errors,
          resultsCount: response.data?.results
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ [BasketballAPI] Connection test failed:`, error);
      throw error;
    }
  },

  /**
   * Get basketball standings
   */
  async getStandings(leagueId: number, season: string): Promise<any[]> {
    try {
      console.log(`🏀 [BasketballAPI] Fetching standings for league ${leagueId}, season ${season}`);

      const response = await basketballApiClient.get("/standings", {
        params: {
          league: leagueId,
          season: season,
        },
      });

      if (response.data && response.data.response) {
        const standings = response.data.response;
        console.log(`🏀 [BasketballAPI] Retrieved ${standings.length} standings entries for league ${leagueId}`);
        return standings;
      }

      return [];
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching standings for league ${leagueId}:`, error);
      return [];
    }
  }
};
