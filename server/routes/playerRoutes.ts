import express from 'express';

const router = express.Router();

// Batch player images by team ID
router.get('/teams/:teamId/players/images', async (req, res) => {
  const { teamId } = req.params;

  if (!teamId || isNaN(Number(teamId))) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }

  try {
    console.log(`🔍 [BatchPlayerImages] Fetching players for team: ${teamId}`);
    
    // First get team squad/players
    const playersResponse = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/players/squads?team=${teamId}`,
      {
        headers: {
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        },
      }
    );

    if (!playersResponse.ok) {
      throw new Error(`Failed to fetch team players: ${playersResponse.status}`);
    }

    const playersData = await playersResponse.json();
    const players = playersData.response?.[0]?.players || [];
    
    console.log(`📊 [BatchPlayerImages] Found ${players.length} players for team ${teamId}`);

    // Build image URLs for all players
    const playerImages: Record<string, string> = {};
    
    for (const player of players) {
      const playerId = player.id;
      if (playerId) {
        // Use the same CDN sources as individual loading
        const imageUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`;
        playerImages[playerId] = imageUrl;
      }
    }

    console.log(`✅ [BatchPlayerImages] Returning ${Object.keys(playerImages).length} player image URLs`);
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