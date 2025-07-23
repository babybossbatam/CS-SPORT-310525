
import express from 'express';
import axios from 'axios';

const router = express.Router();

interface KeyPlayerStats {
  playerId: number;
  playerName: string;
  position: string;
  teamId: number;
  teamName: string;
  stats: {
    interceptions?: number;
    clearances?: number;
    minutesPlayed?: number;
    tackles?: number;
    passes?: number;
    shots?: number;
    saves?: number;
    assists?: number;
    goals?: number;
  };
  photo?: string;
}

// Get key players stats for a specific game
router.get('/game/:gameId/key-players', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    console.log(`🔍 [365Scores] Fetching key players for game: ${gameId}`);
    
    const response = await axios.get(`https://webws.365scores.com/web/game/stats/`, {
      params: {
        appTypeId: 5,
        langId: 1,
        timezoneName: 'Asia/Manila',
        games: gameId,
        onlyIsMajor: true,
        lastUpdateId: Date.now()
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.365scores.com/',
        'Origin': 'https://www.365scores.com'
      },
      timeout: 10000
    });

    if (response.data && response.data.games && response.data.games[0]) {
      const gameData = response.data.games[0];
      const keyPlayers: KeyPlayerStats[] = [];

      // Process home team key players
      if (gameData.homeCompetitor && gameData.homeCompetitor.keyPlayers) {
        gameData.homeCompetitor.keyPlayers.forEach((player: any) => {
          keyPlayers.push({
            playerId: player.id,
            playerName: player.name,
            position: player.position || 'Unknown',
            teamId: gameData.homeCompetitor.id,
            teamName: gameData.homeCompetitor.name,
            stats: {
              interceptions: player.stats?.interceptions || 0,
              clearances: player.stats?.clearances || 0,
              minutesPlayed: player.stats?.minutesPlayed || 90,
              tackles: player.stats?.tackles || 0,
              passes: player.stats?.passes || 0,
              shots: player.stats?.shots || 0,
              saves: player.stats?.saves || 0,
              assists: player.stats?.assists || 0,
              goals: player.stats?.goals || 0
            },
            photo: player.id ? `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${player.id}` : undefined
          });
        });
      }

      // Process away team key players
      if (gameData.awayCompetitor && gameData.awayCompetitor.keyPlayers) {
        gameData.awayCompetitor.keyPlayers.forEach((player: any) => {
          keyPlayers.push({
            playerId: player.id,
            playerName: player.name,
            position: player.position || 'Unknown',
            teamId: gameData.awayCompetitor.id,
            teamName: gameData.awayCompetitor.name,
            stats: {
              interceptions: player.stats?.interceptions || 0,
              clearances: player.stats?.clearances || 0,
              minutesPlayed: player.stats?.minutesPlayed || 90,
              tackles: player.stats?.tackles || 0,
              passes: player.stats?.passes || 0,
              shots: player.stats?.shots || 0,
              saves: player.stats?.saves || 0,
              assists: player.stats?.assists || 0,
              goals: player.stats?.goals || 0
            },
            photo: player.id ? `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${player.id}` : undefined
          });
        });
      }

      console.log(`✅ [365Scores] Found ${keyPlayers.length} key players`);
      
      res.json({
        success: true,
        gameId,
        keyPlayers,
        homeTeam: gameData.homeCompetitor?.name,
        awayTeam: gameData.awayCompetitor?.name
      });
    } else {
      console.log(`⚠️ [365Scores] No key players data found for game ${gameId}`);
      res.json({
        success: false,
        message: 'No key players data available',
        keyPlayers: []
      });
    }
  } catch (error) {
    console.error(`❌ [365Scores] Error fetching key players for game ${gameId}:`, error);
    
    // Check if it's a timeout or network error
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log(`⏱️ [365Scores] Request timeout for game ${gameId}`);
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log(`🌐 [365Scores] Network error for game ${gameId}`);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      keyPlayers: [],
      gameId: gameId,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
