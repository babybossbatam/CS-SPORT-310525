
import axios from 'axios';

interface Scores365GameStats {
  gameId: number;
  homeTeam: {
    id: number;
    name: string;
    stats: Record<string, any>;
  };
  awayTeam: {
    id: number;
    name: string;
    stats: Record<string, any>;
  };
  players: Array<{
    id: number;
    name: string;
    teamId: number;
    position: string;
    stats: Record<string, any>;
    rating?: number;
    minutes?: number;
  }>;
  matchStats: Record<string, any>;
}

class Scores365API {
  private baseUrl = 'https://webws.365scores.com/web/game';
  private headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://www.365scores.com/',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  async getGameStats(gameId: number, timezone: string = 'Asia/Manila'): Promise<Scores365GameStats | null> {
    try {
      console.log(`🎯 [365Scores] Fetching game stats for game ${gameId}`);
      
      const statsUrl = `${this.baseUrl}/stats/`;
      
      const response = await axios.get(statsUrl, {
        params: {
          appTypeId: 5,
          langId: 1,
          timezoneName: timezone,
          games: gameId,
          lastUpdateId: Date.now() // Use current timestamp as update ID
        },
        headers: this.headers,
        timeout: 8000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        console.log(`✅ [365Scores] Retrieved stats for game ${gameId}`);
        return this.processGameStats(response.data, gameId);
      } else {
        console.log(`⚠️ [365Scores] Stats API returned status ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ [365Scores] Error fetching game stats:`, error);
      return null;
    }
  }

  async getPlayerStats(gameId: number, playerId: number, timezone: string = 'Asia/Manila'): Promise<any | null> {
    try {
      const gameStats = await this.getGameStats(gameId, timezone);
      
      if (gameStats && gameStats.players) {
        const playerStats = gameStats.players.find(p => p.id === playerId);
        
        if (playerStats) {
          console.log(`✅ [365Scores] Found player ${playerId} stats in game ${gameId}`);
          return {
            ...playerStats,
            gameId,
            matchStats: gameStats.matchStats
          };
        }
      }
      
      console.log(`⚠️ [365Scores] Player ${playerId} not found in game ${gameId}`);
      return null;
    } catch (error) {
      console.error(`❌ [365Scores] Error fetching player stats:`, error);
      return null;
    }
  }

  private processGameStats(rawData: any, gameId: number): Scores365GameStats {
    // Process the raw 365scores response data
    const games = rawData.games || [];
    const gameData = games.find((g: any) => g.id === gameId) || games[0];
    
    if (!gameData) {
      throw new Error('Game data not found');
    }

    // Extract team data
    const homeTeam = {
      id: gameData.homeCompetitor?.id || 0,
      name: gameData.homeCompetitor?.name || 'Home Team',
      stats: gameData.homeCompetitor?.statistics || {}
    };

    const awayTeam = {
      id: gameData.awayCompetitor?.id || 0,
      name: gameData.awayCompetitor?.name || 'Away Team',
      stats: gameData.awayCompetitor?.statistics || {}
    };

    // Extract player data
    const players: any[] = [];
    
    // Process home team players
    if (gameData.homeCompetitor?.players) {
      gameData.homeCompetitor.players.forEach((player: any) => {
        players.push({
          id: player.id,
          name: player.name,
          teamId: homeTeam.id,
          position: player.position || 'Unknown',
          stats: player.statistics || {},
          rating: player.rating,
          minutes: player.minutesPlayed
        });
      });
    }

    // Process away team players
    if (gameData.awayCompetitor?.players) {
      gameData.awayCompetitor.players.forEach((player: any) => {
        players.push({
          id: player.id,
          name: player.name,
          teamId: awayTeam.id,
          position: player.position || 'Unknown',
          stats: player.statistics || {},
          rating: player.rating,
          minutes: player.minutesPlayed
        });
      });
    }

    return {
      gameId,
      homeTeam,
      awayTeam,
      players,
      matchStats: gameData.statistics || {}
    };
  }

  // Get live game stats with real-time updates
  async getLiveGameStats(gameId: number, timezone: string = 'Asia/Manila'): Promise<Scores365GameStats | null> {
    try {
      // For live games, we might want to use a different endpoint or add live parameters
      const liveUrl = `${this.baseUrl}/stats/`;
      
      const response = await axios.get(liveUrl, {
        params: {
          appTypeId: 5,
          langId: 1,
          timezoneName: timezone,
          games: gameId,
          lastUpdateId: Date.now(),
          live: true // Add live parameter if supported
        },
        headers: this.headers,
        timeout: 5000
      });

      if (response.status === 200 && response.data) {
        return this.processGameStats(response.data, gameId);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [365Scores] Error fetching live game stats:`, error);
      return null;
    }
  }
}

export const scores365API = new Scores365API();
