
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
    console.log(`🔍 [BatchPlayerImages] RapidAPI Key present: ${!!(process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY)}`);

    // Use RapidAPI players endpoint with team ID and current season
    const apiUrl = `https://api-football-v1.p.rapidapi.com/v3/players?team=${teamId}&season=${season}`;
    console.log(`🔗 [BatchPlayerImages] API URL: ${apiUrl}`);
    
    const playersResponse = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || '',
      },
      timeout: 10000,
    });

    console.log(`📡 [BatchPlayerImages] RapidAPI Response status: ${playersResponse.status}`);
    console.log(`📡 [BatchPlayerImages] RapidAPI Response headers:`, {
      contentType: playersResponse.headers.get('content-type'),
      rateLimit: playersResponse.headers.get('x-ratelimit-remaining'),
      rateLimitTotal: playersResponse.headers.get('x-ratelimit-limit')
    });

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

        // Primary CDN source (365Scores) - Dynamic format matching observed patterns
        // Use v21 as primary (most recent version observed), with fallback capability
        const imageUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`;
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

// Enhanced player photo proxy endpoint
router.get('/player-photo/:playerId', async (req, res) => {
  const { playerId } = req.params;

  console.log(`🔍 [PlayerPhoto] Request received for player ID: ${playerId}`);

  if (!playerId || isNaN(Number(playerId))) {
    console.log(`❌ [PlayerPhoto] Invalid player ID provided: ${playerId}`);
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    // Set proper headers for image proxy
    res.set({
      'Cache-Control': 'public, max-age=86400', // 24 hours cache
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Try multiple CDN sources in order
    const imageSources = [
      `https://media.api-sports.io/football/players/${playerId}.png`,
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`,
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
      `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`
    ];

    console.log(`🔍 [PlayerPhoto] Trying ${imageSources.length} sources for player ${playerId}`);

    for (let i = 0; i < imageSources.length; i++) {
      const imageUrl = imageSources[i];
      console.log(`🔗 [PlayerPhoto] Trying source ${i + 1}: ${imageUrl}`);

      try {
        const imageResponse = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
            'Referer': 'https://www.365scores.com/',
          },
          timeout: 5000,
        });

        console.log(`📡 [PlayerPhoto] Source ${i + 1} response: ${imageResponse.status}`);

        if (imageResponse.ok && imageResponse.headers.get('content-type')?.startsWith('image/')) {
          console.log(`✅ [PlayerPhoto] Found valid image at source ${i + 1} for player ${playerId}`);
          
          // Set proper content type
          res.set('Content-Type', imageResponse.headers.get('content-type') || 'image/png');
          
          // Stream the image directly to client
          const imageBuffer = await imageResponse.buffer();
          return res.send(imageBuffer);
        }
      } catch (sourceError) {
        console.log(`⚠️ [PlayerPhoto] Source ${i + 1} failed: ${sourceError.message}`);
        continue;
      }
    }

    // If all sources fail, return 404
    console.log(`❌ [PlayerPhoto] All sources failed for player ${playerId}`);
    return res.status(404).json({ error: 'Player photo not found in any source' });

  } catch (error) {
    console.error(`❌ [PlayerPhoto] Error fetching player ${playerId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch player photo' });
  }
});


// Enhanced name-based player photo search with proper proxy
router.get('/player-photo-by-name', async (req, res) => {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    console.log(`❌ [PlayerPhotoByName] Invalid player name provided: ${name}`);
    return res.status(400).json({ error: 'Invalid player name' });
  }

  console.log(`🔍 [PlayerPhotoByName] Searching photo for player name: "${name}"`);

  try {
    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600', // 1 hour cache for name searches
    });

    // First try: Search via RapidAPI (with rate limiting protection)
    let foundImageUrl = null;
    let playerId = null;

    try {
      console.log(`🔍 [PlayerPhotoByName] Searching RapidAPI for: "${name}"`);
      const searchUrl = `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(name)}`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || '',
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        },
        timeout: 5000,
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`📊 [PlayerPhotoByName] RapidAPI found ${searchData.response?.length || 0} results for "${name}"`);
        
        if (searchData.response && searchData.response.length > 0) {
          const player = searchData.response[0];
          playerId = player.player?.id;
          
          // If we have a direct photo URL from API, try it first
          if (player.player?.photo && !player.player.photo.includes('default.png')) {
            foundImageUrl = player.player.photo;
            console.log(`🎯 [PlayerPhotoByName] Found direct photo URL from API: ${foundImageUrl}`);
          }
        }
      } else if (searchResponse.status === 429) {
        console.log(`⚠️ [PlayerPhotoByName] RapidAPI rate limited, skipping API search`);
      }
    } catch (apiError) {
      console.log(`⚠️ [PlayerPhotoByName] RapidAPI search failed: ${apiError.message}`);
    }

    // Build list of image URLs to try
    const imageUrls = [];
    
    // Add API-found URL first if available
    if (foundImageUrl) {
      imageUrls.push(foundImageUrl);
    }
    
    // Add ID-based URLs if we found a player ID
    if (playerId) {
      imageUrls.push(
        `https://media.api-sports.io/football/players/${playerId}.png`,
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`,
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`
      );
    }

    console.log(`🔗 [PlayerPhotoByName] Trying ${imageUrls.length} image URLs for "${name}"`);

    // Try each image URL
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`🔗 [PlayerPhotoByName] Trying URL ${i + 1}: ${imageUrl}`);

      try {
        const imageResponse = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
          },
          timeout: 5000,
        });

        if (imageResponse.ok && imageResponse.headers.get('content-type')?.startsWith('image/')) {
          console.log(`✅ [PlayerPhotoByName] Found valid image for "${name}" at URL ${i + 1}`);
          
          // Set proper content type and stream image
          res.set('Content-Type', imageResponse.headers.get('content-type') || 'image/png');
          const imageBuffer = await imageResponse.buffer();
          return res.send(imageBuffer);
        }
      } catch (urlError) {
        console.log(`⚠️ [PlayerPhotoByName] URL ${i + 1} failed: ${urlError.message}`);
        continue;
      }
    }

    // If no photo found, return 404
    console.log(`❌ [PlayerPhotoByName] No photo found for "${name}"`);
    return res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhotoByName] Error searching for player photo "${name}":`, error);
    return res.status(500).json({ error: 'Failed to search for player photo' });
  }
});

      // Source 2: Generate URL based on common name patterns
      async () => {
        // Clean the name for URL generation
        const cleanName = name
          .toLowerCase()
          .replace(/[^a-z\s]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .trim();

        // Try TheSportsDB (if they have an image endpoint)
        const sportsDbUrl = `https://www.thesportsdb.com/images/media/player/thumb/${cleanName}.jpg`;
        
        try {
          const response = await fetch(sportsDbUrl, { method: 'HEAD', timeout: 3000 });
          if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            return sportsDbUrl;
          }
        } catch (error) {
          // Source not available, continue
        }
        return null;
      },

      // Source 3: Try with initials/short name patterns
      async () => {
        const nameParts = name.split(' ');
        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          const shortName = `${firstName[0].toLowerCase()}${lastName.toLowerCase()}`;
          
          // Try various short name patterns that some sites use
          const patterns = [
            `https://img.a.transfermarkt.technology/portrait/medium/${shortName}.jpg`,
            `https://resources.premierleague.com/premierleague/photos/players/250x250/${shortName}.png`,
          ];

          for (const pattern of patterns) {
            try {
              const response = await fetch(pattern, { method: 'HEAD', timeout: 3000 });
              if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
                return pattern;
              }
            } catch (error) {
              continue;
            }
          }
        }
        return null;
      }
    ];

    // Try each source until we find a valid photo
    for (const searchFunction of searchSources) {
      try {
        const photoUrl = await searchFunction();
        if (photoUrl) {
          console.log(`✅ [PlayerPhotoByName] Found photo for "${name}": ${photoUrl}`);
          return res.redirect(photoUrl);
        }
      } catch (error) {
        console.log(`⚠️ [PlayerPhotoByName] Search source failed for "${name}":`, error.message);
        continue;
      }
    }

    // If no photo found, return 404 (client will use initials fallback)
    console.log(`❌ [PlayerPhotoByName] No photo found for "${name}"`);
    return res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhotoByName] Error searching for player photo "${name}":`, error);
    return res.status(500).json({ error: 'Failed to search for player photo' });
  }
});

    const imageUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`;
    console.log(`🔗 [PlayerPhoto] Generated image URL: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      method: 'HEAD',
      timeout: 5000,
    });

    console.log(`📡 [PlayerPhoto] Response status: ${response.status}`);
    console.log(`📡 [PlayerPhoto] Response headers:`, {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      cacheControl: response.headers.get('cache-control')
    });

    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      console.log(`✅ [PlayerPhoto] Found valid image for player ${playerId}, redirecting to: ${imageUrl}`);
      return res.redirect(imageUrl);
    }

    // If 365Scores fails, return 404 (client will use initials fallback)
    console.log(`❌ [PlayerPhoto] No valid image found for player ${playerId} - Status: ${response.status}, ContentType: ${response.headers.get('content-type')}`);
    res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhoto] Error fetching player ${playerId}:`, error);
    console.error(`❌ [PlayerPhoto] Error details:`, {
      message: error.message,
      code: error.code,
      type: error.constructor.name
    });
    res.status(500).json({ error: 'Failed to fetch player photo' });

// Image URL validation endpoint to avoid CORS issues
router.get('/validate-image-url', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  console.log(`🔍 [ImageValidation] Validating URL: ${url}`);

  try {
    // Use HEAD request to check if image exists without downloading it
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 5000,
    });

    console.log(`📡 [ImageValidation] Response status: ${response.status} for ${url}`);
    console.log(`📡 [ImageValidation] Content-Type: ${response.headers.get('content-type')}`);

    const isValid = response.ok && (
      response.headers.get('content-type')?.startsWith('image/') ||
      response.headers.get('content-type')?.includes('image') ||
      // Some CDNs return different content types for HEAD requests
      response.status === 200
    );

    const headers = {
      lastModified: response.headers.get('last-modified') || undefined,
      etag: response.headers.get('etag') || undefined,
      contentType: response.headers.get('content-type') || undefined,
    };

    if (isValid) {
      console.log(`✅ [ImageValidation] Valid image found: ${url}`);
    } else {
      console.log(`❌ [ImageValidation] Invalid or non-image response: ${url}`);
    }

    res.json({
      isValid,
      headers,
      status: response.status,
      url: url
    });

  } catch (error) {
    console.error(`❌ [ImageValidation] Error validating ${url}:`, error);
    res.status(500).json({
      isValid: false,
      error: error.message,
      url: url
    });
  }
});


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

// Test endpoint to check RapidAPI connectivity
router.get('/test-rapidapi', async (req, res) => {
  console.log(`🧪 [TestRapidAPI] Testing RapidAPI connectivity...`);
  
  try {
    const apiKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
    console.log(`🔑 [TestRapidAPI] API Key present: ${!!apiKey}`);
    console.log(`🔑 [TestRapidAPI] API Key prefix: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET'}`);

    // Test with a simple leagues endpoint
    const testUrl = 'https://api-football-v1.p.rapidapi.com/v3/leagues?current=true';
    console.log(`🔗 [TestRapidAPI] Test URL: ${testUrl}`);

    const response = await fetch(testUrl, {
      headers: {
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey || '',
      },
      timeout: 10000,
    });

    console.log(`📡 [TestRapidAPI] Response status: ${response.status}`);
    console.log(`📡 [TestRapidAPI] Response headers:`, {
      contentType: response.headers.get('content-type'),
      rateLimit: response.headers.get('x-ratelimit-remaining'),
      rateLimitTotal: response.headers.get('x-ratelimit-limit'),
      requestsRemaining: response.headers.get('x-ratelimit-requests-remaining')
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [TestRapidAPI] Success! Results count: ${data.results || 0}`);
      res.json({
        success: true,
        status: response.status,
        resultsCount: data.results || 0,
        message: 'RapidAPI is working correctly'
      });
    } else {
      const errorText = await response.text();
      console.log(`❌ [TestRapidAPI] Failed with status ${response.status}: ${errorText}`);
      res.status(response.status).json({
        success: false,
        status: response.status,
        error: errorText,
        message: 'RapidAPI request failed'
      });
    }
  } catch (error) {
    console.error(`❌ [TestRapidAPI] Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'RapidAPI test failed with exception'
    });
  }
});

export default router;
