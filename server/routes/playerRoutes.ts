
import express from 'express';

const router = express.Router();

// Batch player images by team ID using RapidAPI players endpoint
router.get('/teams/:teamId/players/images', async (req, res) => {
  const { teamId } = req.params;
  const currentYear = new Date().getFullYear();
  const season = req.query.season || currentYear.toString();

  if (!teamId || isNaN(Number(teamId))) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }

  try {
    console.log(`🔍 [BatchPlayerImages] Fetching players for team: ${teamId}, season: ${season}`);

    // Use RapidAPI players endpoint with team ID and current season
    const playersResponse = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/players?team=${teamId}&season=${season}`,
      {
        headers: {
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || '',
        },
        timeout: 10000,
      }
    );

    if (!playersResponse.ok) {
      console.warn(`⚠️ [BatchPlayerImages] API request failed with status: ${playersResponse.status}`);
      throw new Error(`Failed to fetch team players: ${playersResponse.status}`);
    }

    const playersData = await playersResponse.json();
    const players = playersData.response || [];

    console.log(`📊 [BatchPlayerImages] Found ${players.length} players for team ${teamId} in season ${season}`);

    // Build image URLs for all players with multiple CDN fallbacks
    const playerImages: Record<string, string> = {};

    for (const playerData of players) {
      const playerId = playerData.player?.id;
      const playerName = playerData.player?.name;

      if (playerId) {
        // Create cache key for the player
        const cacheKey = `${playerId}_${playerName || 'unknown'}`;

        // Primary CDN source (365Scores) - Updated URL format
        const imageUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`;
        playerImages[cacheKey] = imageUrl;

        // Store individual player ID mapping for backward compatibility
        playerImages[playerId.toString()] = imageUrl;

        // Store additional metadata
        playerImages[`${playerId}_name`] = playerName || 'Unknown Player';
        playerImages[`${playerId}_team`] = teamId;
      }
    }

    console.log(`✅ [BatchPlayerImages] Returning ${players.length} players with ${Object.keys(playerImages).length} cache entries`);
    res.json(playerImages);

  } catch (error) {
    console.error(`❌ [BatchPlayerImages] Error fetching team players:`, error);
    res.status(500).json({ error: 'Failed to fetch team player images' });
  }
});

// Batch player images by league ID (top players)
router.get('/leagues/:leagueId/players/images', async (req, res) => {
  const { leagueId } = req.params;
  const season = req.query.season || new Date().getFullYear();

  if (!leagueId || isNaN(Number(leagueId))) {
    return res.status(400).json({ error: 'Invalid league ID' });
  }

  try {
    console.log(`🔍 [BatchPlayerImages] Fetching top players for league: ${leagueId}`);

    // Get top scorers for the league
    const topScorersResponse = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/players/topscorers?league=${leagueId}&season=${season}`,
      {
        headers: {
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        },
      }
    );

    if (!topScorersResponse.ok) {
      throw new Error(`Failed to fetch league top scorers: ${topScorersResponse.status}`);
    }

    const topScorersData = await topScorersResponse.json();
    const players = topScorersData.response || [];

    console.log(`📊 [BatchPlayerImages] Found ${players.length} top players for league ${leagueId}`);

    // Build image URLs for all players
    const playerImages: Record<string, string> = {};

    for (const playerData of players.slice(0, 50)) { // Limit to top 50
      const playerId = playerData.player?.id;
      if (playerId) {
        const imageUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`;
        playerImages[playerId] = imageUrl;
      }
    }

    console.log(`✅ [BatchPlayerImages] Returning ${Object.keys(playerImages).length} league player image URLs`);
    res.json(playerImages);

  } catch (error) {
    console.error(`❌ [BatchPlayerImages] Error fetching league players:`, error);
    res.status(500).json({ error: 'Failed to fetch league player images' });
  }
});

// Simplified player photo endpoint using RapidAPI
router.get('/player-photo/:playerId', async (req, res) => {
  const { playerId } = req.params;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  console.log(`🔍 [PlayerPhoto] Fetching photo for player ${playerId} using RapidAPI`);

  try {
    // Use 365Scores CDN format (primary source used in team batch endpoint)
    const imageUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`;

    const response = await fetch(imageUrl, {
      method: 'HEAD',
      timeout: 5000,
    });

    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      console.log(`✅ [PlayerPhoto] Found image for player ${playerId}`);
      return res.redirect(imageUrl);
    }

    // If 365Scores fails, return 404 (client will use initials fallback)
    console.log(`❌ [PlayerPhoto] No image found for player ${playerId}`);
    res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhoto] Error fetching player ${playerId}:`, error);
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
