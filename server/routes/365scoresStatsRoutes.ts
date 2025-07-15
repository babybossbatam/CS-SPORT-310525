
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Route to fetch game statistics from 365scores
router.get('/game/:gameId/stats', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { onlyIsMajor, lastUpdateId } = req.query;
    
    console.log(`📊 [365Scores Stats] Fetching stats for game: ${gameId}`);
    
    const baseUrl = 'https://webws.365scores.com/web/game/stats/';
    const params = new URLSearchParams({
      appTypeId: '5',
      langId: '1',
      timezoneName: 'Asia/Manila',
      games: gameId as string,
    });
    
    if (onlyIsMajor) {
      params.append('onlyIsMajor', 'true');
    }
    
    if (lastUpdateId) {
      params.append('lastUpdateId', lastUpdateId as string);
    }
    
    const response = await axios.get(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.365scores.com/',
        'Origin': 'https://www.365scores.com'
      },
      timeout: 10000
    });
    
    console.log(`✅ [365Scores Stats] Successfully fetched stats for game ${gameId}`);
    
    res.json(response.data);
  } catch (error) {
    console.error(`❌ [365Scores Stats] Error fetching stats:`, error);
    res.status(500).json({ error: 'Failed to fetch game statistics' });
  }
});

// Route to get player statistics from 365scores game stats
router.get('/game/:gameId/players', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    console.log(`👥 [365Scores Players] Fetching player stats for game: ${gameId}`);
    
    // First get the basic stats
    const baseUrl = 'https://webws.365scores.com/web/game/stats/';
    const params = new URLSearchParams({
      appTypeId: '5',
      langId: '1',
      timezoneName: 'Asia/Manila',
      games: gameId as string,
    });
    
    const response = await axios.get(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.365scores.com/',
        'Origin': 'https://www.365scores.com'
      },
      timeout: 10000
    });
    
    const gameData = response.data;
    console.log(`🔍 [365Scores Players] Game data structure:`, JSON.stringify(gameData, null, 2));
    
    // Extract player statistics from the response
    let playerStats = [];
    
    if (gameData && gameData.games && gameData.games[0]) {
      const game = gameData.games[0];
      
      // Look for player data in various possible locations
      if (game.playerStats) {
        playerStats = game.playerStats;
      } else if (game.statistics && game.statistics.playerStats) {
        playerStats = game.statistics.playerStats;
      } else if (game.lineups) {
        // Extract players from lineups and add basic stats
        const homeLineup = game.lineups.home || [];
        const awayLineup = game.lineups.away || [];
        
        playerStats = [...homeLineup, ...awayLineup].map(player => ({
          player: {
            id: player.playerId || player.id,
            name: player.playerName || player.name,
            photo: player.photo || `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${player.playerId || player.id}`
          },
          statistics: [{
            team: {
              id: player.teamId,
              name: player.teamName
            },
            games: {
              minutes: player.minutesPlayed || 90,
              position: player.position || 'Midfielder'
            },
            goals: {
              total: player.goals || 0,
              assists: player.assists || 0
            },
            shots: {
              total: player.shots || 0,
              on: player.shotsOnTarget || 0
            },
            passes: {
              total: player.passes || 0,
              key: player.keyPasses || 0,
              accuracy: player.passAccuracy || 0
            },
            tackles: {
              total: player.tackles || 0,
              blocks: player.blocks || 0,
              interceptions: player.interceptions || 0
            },
            duels: {
              total: player.duels || 0,
              won: player.duelsWon || 0
            },
            fouls: {
              drawn: player.foulsDrawn || 0,
              committed: player.foulsCommitted || 0
            }
          }]
        }));
      }
    }
    
    console.log(`✅ [365Scores Players] Found ${playerStats.length} players`);
    
    res.json(playerStats);
  } catch (error) {
    console.error(`❌ [365Scores Players] Error fetching player stats:`, error);
    res.status(500).json({ error: 'Failed to fetch player statistics' });
  }
});

export default router;
