import express from 'express';

const router = express.Router();

// Simplified name-based player photo search endpoint
router.get('/player-photo-by-name', async (req, res) => {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid player name' });
  }

  console.log(`🔍 [PlayerPhotoByName] Searching photo for: "${name}"`);

  try {
    // Source 1: Try RapidAPI search (but with error handling for rate limits)
    try {
      const searchUrl = `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(name)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        },
        timeout: 5000, // 5 second timeout
      });

      // Check for rate limiting
      if (response.status === 429 || response.status === 403) {
        console.log(`⚠️ [PlayerPhotoByName] RapidAPI rate limited (${response.status}), skipping`);
      } else if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.length > 0) {
          const player = data.response[0];

          // Check if player has a good photo (not default)
          if (player.player?.photo && !player.player.photo.includes('default.png')) {
            console.log(`✅ [PlayerPhotoByName] Found photo via RapidAPI for "${name}": ${player.player.photo}`);
            return res.redirect(player.player.photo);
          }

          // If photo exists but is default, try with player ID using API-Sports
          if (player.player?.id) {
            const idBasedUrl = `https://media.api-sports.io/football/players/${player.player.id}.png`;
            console.log(`🔄 [PlayerPhotoByName] Trying ID-based URL for "${name}": ${idBasedUrl}`);

            // Quick validation
            try {
              const testResponse = await fetch(idBasedUrl, { method: 'HEAD', timeout: 3000 });
              if (testResponse.ok) {
                console.log(`✅ [PlayerPhotoByName] ID-based photo works for "${name}"`);
                return res.redirect(idBasedUrl);
              }
            } catch (error) {
              console.log(`❌ [PlayerPhotoByName] ID-based photo failed for "${name}"`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [PlayerPhotoByName] RapidAPI error for "${name}":`, error.message);
    }

    // Source 2: Try common name patterns for well-known sources
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0].toLowerCase();
      const lastName = nameParts[nameParts.length - 1].toLowerCase();

      // Try various naming patterns that some CDNs use
      const patterns = [
        `https://resources.premierleague.com/premierleague/photos/players/250x250/${firstName}-${lastName}.png`,
        `https://img.a.transfermarkt.technology/portrait/medium/${firstName}-${lastName}.jpg`,
      ];

      for (const pattern of patterns) {
        try {
          const response = await fetch(pattern, { method: 'HEAD', timeout: 3000 });
          if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            console.log(`✅ [PlayerPhotoByName] Found pattern-based photo for "${name}": ${pattern}`);
            return res.redirect(pattern);
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    }

    // No photo found
    console.log(`❌ [PlayerPhotoByName] No photo found for "${name}"`);
    return res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhotoByName] Error searching for "${name}":`, error);
    return res.status(500).json({ error: 'Failed to search for player photo' });
  }
});

// Keep the simplified player photo by ID endpoint
router.get('/player-photo/:playerId', async (req, res) => {
  const { playerId } = req.params;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    // Try API-Sports first
    const apiSportsUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
    const response = await fetch(apiSportsUrl, { method: 'HEAD', timeout: 3000 });

    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      return res.redirect(apiSportsUrl);
    }

    // Try 365Scores as backup
    const cdnUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`;
    const cdnResponse = await fetch(cdnUrl, { method: 'HEAD', timeout: 3000 });

    if (cdnResponse.ok) {
      return res.redirect(cdnUrl);
    }

    // No photo found
    res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhoto] Error fetching player ${playerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch player photo' });
  }
});

export default router;