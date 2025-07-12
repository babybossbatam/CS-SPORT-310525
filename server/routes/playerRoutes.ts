import express from 'express';

const router = express.Router();

// Player photo endpoint using RapidAPI for actual player photos
router.get('/player-photo/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { teamId, season = '2024' } = req.query;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    console.log(`📷 [PlayerPhoto] Fetching actual photo for player ${playerId}, team ${teamId}, season ${season}`);
    
    const { rapidApiService } = await import('../services/rapidApi');
    
    // First try to get player data from RapidAPI to get the actual photo
    const playerStats = await rapidApiService.getPlayerStatistics(
      Number(playerId), 
      teamId ? Number(teamId) : undefined, 
      Number(season)
    );

    if (playerStats && playerStats.length > 0) {
      const playerPhoto = playerStats[0]?.player?.photo;
      
      if (playerPhoto && playerPhoto !== '' && !playerPhoto.includes('default')) {
        console.log(`✅ [PlayerPhoto] Found actual player photo from RapidAPI: ${playerPhoto}`);
        
        // Validate the photo URL
        try {
          const photoResponse = await fetch(playerPhoto, { method: 'HEAD', timeout: 3000 });
          if (photoResponse.ok && photoResponse.headers.get('content-type')?.startsWith('image/')) {
            return res.redirect(playerPhoto);
          }
        } catch (photoError) {
          console.log(`⚠️ [PlayerPhoto] RapidAPI photo URL validation failed: ${photoError.message}`);
        }
      }
    }

    // Fallback to CDN sources if no actual photo from API
    console.log(`🔄 [PlayerPhoto] No actual photo from RapidAPI, trying CDN fallbacks for player ${playerId}`);
    
    const cdnSources = [
      // API-Sports CDN (most reliable for actual photos)
      `https://media.api-sports.io/football/players/${playerId}.png`,
      // BeSoccer CDN (good for European players)
      `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
      // Alternative BeSoccer format
      `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg`,
      // 365Scores CDN (last resort)
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
    ];

    for (const url of cdnSources) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          timeout: 3000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          console.log(`✅ [PlayerPhoto] Found CDN image for player ${playerId} at: ${url}`);
          return res.redirect(url);
        }
      } catch (error) {
        console.log(`⚠️ [PlayerPhoto] CDN source failed ${url}:`, error.message);
      }
    }

    // If no image found, return a 404
    console.log(`❌ [PlayerPhoto] No actual photo found for player ${playerId}`);
    res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhoto] Error fetching player photo:`, error);
    res.status(500).json({ error: 'Failed to fetch player photo' });
  }
});

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

export default router;

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
