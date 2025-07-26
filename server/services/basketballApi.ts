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

interface BasketballApiResponse {
  get: string;
  parameters: any;
  errors: any[];
  results: number;
  response: BasketballGame[];
}

// Initialize Basketball API client
const apiKey = "81bc62b91b1190622beda24ee23fbd1a";

const basketballApiClient = axios.create({
  baseURL: "https://v1.basketball.api-sports.io",
  headers: {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "v1.basketball.api-sports.io",
  },
  timeout: 10000, // 10 second timeout
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

  async getTopScorers(leagueId: number, season: string) {
    try {
      // Extract year from season string (e.g., "2024-2025" -> 2024)
      const seasonYear = parseInt(season.split('-')[0]);

      console.log(`🏀 [BasketballAPI] Fetching top scorers for league ${leagueId}, season ${seasonYear}`);

      // Try multiple endpoints to get player statistics
      let response;
      
      try {
        // First try the players endpoint with statistics
        response = await basketballApiClient.get("/players", {
          params: {
            league: leagueId,
            season: seasonYear
          }
        });
        
        if (!response.data?.response || response.data.response.length === 0) {
          throw new Error("No players data from /players endpoint");
        }
        
        console.log(`🏀 [BasketballAPI] Got ${response.data.response.length} players from /players endpoint`);
        
        // Now get statistics for these players
        const playersWithStats = [];
        
        for (const playerData of response.data.response.slice(0, 50)) { // Limit to first 50 players to avoid rate limits
          try {
            const statsResponse = await basketballApiClient.get("/players/statistics", {
              params: {
                id: playerData.id,
                league: leagueId,
                season: seasonYear
              }
            });
            
            if (statsResponse.data?.response && statsResponse.data.response.length > 0) {
              const playerStats = statsResponse.data.response[0];
              if (playerStats.statistics && playerStats.statistics.length > 0) {
                playersWithStats.push(playerStats);
              }
            }
          } catch (statsError) {
            console.warn(`⚠️ [BasketballAPI] Failed to get stats for player ${playerData.id}:`, statsError);
          }
        }
        
        if (playersWithStats.length === 0) {
          throw new Error("No player statistics found");
        }
        
        // Sort players by points
        const sortedPlayers = playersWithStats
          .filter((player: any) => player.statistics && player.statistics.length > 0)
          .sort((a: any, b: any) => {
            const statsA = a.statistics[0];
            const statsB = b.statistics[0];
            const pointsA = statsA?.points || 0;
            const pointsB = statsB?.points || 0;
            return pointsB - pointsA;
          })
          .slice(0, 10) // Get top 10 scorers
          .map((player: any) => {
            const stat = player.statistics[0];
            return {
              player: {
                id: player.player?.id || 0,
                name: player.player?.name || 'Unknown Player',
                photo: player.player?.photo || `https://media.api-sports.io/basketball/players/${player.player?.id}.png`
              },
              statistics: [{
                team: {
                  id: stat.team?.id || 0,
                  name: stat.team?.name || 'Unknown Team',
                  logo: stat.team?.logo || `https://media.api-sports.io/basketball/teams/${stat.team?.id}.png`
                },
                league: {
                  id: leagueId,
                  name: stat.league?.name || 'Basketball League',
                  season: seasonYear
                },
                games: {
                  appearences: stat.games?.played || 0,
                  position: stat.position || 'Player'
                },
                goals: { 
                  total: stat.points || 0  // Basketball uses points instead of goals
                }
              }]
            };
          });

        console.log(`✅ [BasketballAPI] Retrieved ${sortedPlayers.length} real top scorers for league ${leagueId}`);
        return sortedPlayers;
        
      } catch (playersError) {
        console.warn(`⚠️ [BasketballAPI] /players endpoint failed, trying direct statistics:`, playersError);
        
        // Fallback: try direct statistics endpoint
        response = await basketballApiClient.get("/players/statistics", {
          params: {
            league: leagueId,
            season: seasonYear
          }
        });
        
        if (response.data && response.data.response) {
          const players = response.data.response;

          // Sort players by points
          const sortedPlayers = players
            .filter((player: any) => player.statistics && player.statistics.length > 0)
            .sort((a: any, b: any) => {
              const pointsA = a.statistics[0]?.points || 0;
              const pointsB = b.statistics[0]?.points || 0;
              return pointsB - pointsA;
            })
            .slice(0, 10) // Get top 10 scorers
            .map((player: any) => ({
              player: {
                id: player.player?.id || 0,
                name: player.player?.name || 'Unknown Player',
                photo: player.player?.photo || `https://media.api-sports.io/basketball/players/${player.player?.id}.png`
              },
              statistics: player.statistics.map((stat: any) => ({
                team: {
                  id: stat.team?.id || 0,
                  name: stat.team?.name || 'Unknown Team',
                  logo: stat.team?.logo || `https://media.api-sports.io/basketball/teams/${stat.team?.id}.png`
                },
                league: {
                  id: leagueId,
                  name: stat.league?.name || 'Basketball League',
                  season: seasonYear
                },
                games: {
                  appearences: stat.games?.played || 0,
                  position: stat.position || 'Player'
                },
                goals: { 
                  total: stat.points || 0  // Basketball uses points instead of goals
                }
              }))
            }));

          console.log(`✅ [BasketballAPI] Retrieved ${sortedPlayers.length} real top scorers for league ${leagueId} (fallback method)`);
          return sortedPlayers;
        }
      }

      console.warn(`⚠️ [BasketballAPI] No player statistics found for league ${leagueId}`);
      throw new Error(`No basketball statistics available for league ${leagueId}`);
      
    } catch (error) {
      console.error(`❌ [BasketballAPI] Error fetching top scorers for league ${leagueId}:`, error);
      throw error; // Re-throw to prevent fallback to mock data
    }
  }
};