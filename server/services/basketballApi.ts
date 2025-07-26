
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
});

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
};
