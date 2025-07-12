import express from 'express';

const router = express.Router();

// Player photo endpoint with multiple CDN fallbacks
router.get('/player-photo/:playerId', async (req, res) => {
  const { playerId } = req.params;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  const cdnSources = [
    // 365Scores CDN (primary)
    `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
    // API-Sports CDN
    `https://media.api-sports.io/football/players/${playerId}.png`,
    // BeSoccer CDN
    `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
    // SportMonks CDN
    `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
  ];

  console.log(`🔍 [PlayerPhoto] Trying to fetch photo for player ${playerId}`);

  for (const url of cdnSources) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000,
      });

      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        console.log(`✅ [PlayerPhoto] Found image for player ${playerId} at: ${url}`);
        return res.redirect(url);
      }
    } catch (error) {
      console.log(`⚠️ [PlayerPhoto] Failed to fetch from ${url}:`, error.message);
    }
  }

  // If no image found, return a 404
  console.log(`❌ [PlayerPhoto] No image found for player ${playerId}`);
  res.status(404).json({ error: 'Player photo not found' });


// Player statistics endpoint
router.get('/player-statistics/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { team, season } = req.query;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    console.log(`🏃‍♂️ [Player Stats] Fetching statistics for player ${playerId}, team ${team}, season ${season}`);
    
    const { rapidApiService } = await import('../services/rapidApi');
    const playerStats = await rapidApiService.getPlayerStatistics(
      Number(playerId), 
      team ? Number(team) : undefined, 
      season ? Number(season) : 2024
    );

    if (playerStats && playerStats.length > 0) {
      console.log(`✅ [Player Stats] Found statistics for player ${playerId}`);
      res.json(playerStats);
    } else {
      console.log(`❌ [Player Stats] No statistics found for player ${playerId}`);
      res.status(404).json({ error: 'Player statistics not found' });
    }
  } catch (error) {
    console.error(`❌ [Player Stats] Error fetching statistics for player ${playerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch player statistics' });
  }
});

});

export default router;
import { Router } from 'express';
import { rapidApiService } from '../services/rapidApi';

const router = Router();

/**
 * Get player photo from RapidAPI players endpoint
 */
router.get('/player-photo/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { teamId, season = '2024' } = req.query;

    console.log(`📷 [Player Photo API] Fetching photo for player ${playerId}, team ${teamId}, season ${season}`);

    // Get player data from RapidAPI
    const playerData = await rapidApiService.getPlayerStatistics(
      parseInt(playerId), 
      teamId ? parseInt(teamId as string) : undefined, 
      parseInt(season as string)
    );

    if (playerData && playerData.length > 0) {
      const player = playerData[0];
      const photoUrl = player.player?.photo;

      if (photoUrl) {
        console.log(`✅ [Player Photo API] Found photo URL for player ${playerId}: ${photoUrl}`);
        
        // Redirect to the actual photo URL
        return res.redirect(photoUrl);
      }
    }

    console.log(`❌ [Player Photo API] No photo found for player ${playerId}`);
    
    // Return 404 if no photo found
    res.status(404).json({ 
      error: 'Player photo not found',
      playerId: playerId 
    });

  } catch (error) {
    console.error(`❌ [Player Photo API] Error fetching player photo:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch player photo',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get comprehensive player data including photo
 */
router.get('/:playerId/stats', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { teamId, season = '2024' } = req.query;

    console.log(`📊 [Player Stats API] Fetching stats for player ${playerId}, team ${teamId}, season ${season}`);

    const playerData = await rapidApiService.getPlayerStatistics(
      parseInt(playerId), 
      teamId ? parseInt(teamId as string) : undefined, 
      parseInt(season as string)
    );

    if (playerData && playerData.length > 0) {
      console.log(`✅ [Player Stats API] Found data for player ${playerId}`);
      res.json(playerData);
    } else {
      console.log(`❌ [Player Stats API] No data found for player ${playerId}`);
      res.status(404).json({ 
        error: 'Player data not found',
        playerId: playerId 
      });
    }

  } catch (error) {
    console.error(`❌ [Player Stats API] Error fetching player stats:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch player stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
