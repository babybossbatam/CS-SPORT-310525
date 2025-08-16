import express from 'express';

const router = express.Router();

// Enhanced name-based player photo search endpoint
router.get('/player-photo-by-name', async (req, res) => {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid player name' });
  }

  console.log(`🔍 [PlayerPhotoByName] Searching photo for: "${name}"`);

  try {
    // Enhanced name variations for better matching
    const nameVariations = generateNameVariations(name);
    console.log(`🔄 [PlayerPhotoByName] Generated ${nameVariations.length} name variations for "${name}"`);

    // Source 1: Try RapidAPI search with multiple name variations
    for (const variation of nameVariations) {
      try {
        const searchUrl = `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(variation)}`;
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
          break; // Stop trying variations if rate limited
        } else if (response.ok) {
          const data = await response.json();
          if (data.response && data.response.length > 0) {
            // Try to find the best match (exact name match first)
            let bestPlayer = data.response[0];
            for (const playerData of data.response) {
              if (playerData.player?.name && playerData.player.name.toLowerCase() === name.toLowerCase()) {
                bestPlayer = playerData;
                break;
              }
            }

            // Check if player has a good photo (not default or placeholder)
            if (bestPlayer.player?.photo && 
                !bestPlayer.player.photo.includes('default.png') && 
                !bestPlayer.player.photo.includes('placeholder') &&
                !bestPlayer.player.photo.includes('ui-avatars.com')) {
              console.log(`✅ [PlayerPhotoByName] Found RapidAPI photo for "${name}" (variation: "${variation}"): ${bestPlayer.player.photo}`);
              return res.redirect(bestPlayer.player.photo);
            }

            // If photo exists but is default, try with player ID using API-Sports
            if (bestPlayer.player?.id) {
              const idBasedUrl = `https://media.api-sports.io/football/players/${bestPlayer.player.id}.png`;
              console.log(`🔄 [PlayerPhotoByName] Trying API-Sports ID-based URL for "${name}": ${idBasedUrl}`);

              // Quick validation
              try {
                const testResponse = await fetch(idBasedUrl, { method: 'HEAD', timeout: 3000 });
                if (testResponse.ok && testResponse.headers.get('content-type')?.startsWith('image/')) {
                  console.log(`✅ [PlayerPhotoByName] API-Sports photo works for "${name}"`);
                  return res.redirect(idBasedUrl);
                }
              } catch (error) {
                console.log(`❌ [PlayerPhotoByName] API-Sports photo failed for "${name}"`);
              }
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ [PlayerPhotoByName] RapidAPI error for "${name}" (variation: "${variation}"):`, error.message);
        continue; // Try next variation
      }
    }

    // Source 2: Try direct API-Sports patterns first (more reliable)
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Source 3: Try common name patterns for well-known sources
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0].toLowerCase();
      const lastName = nameParts[nameParts.length - 1].toLowerCase();

      // More reliable patterns prioritizing official sources
      const patterns = [
        // Premier League official photos
        `https://resources.premierleague.com/premierleague/photos/players/250x250/${firstName}-${lastName}.png`,
        `https://resources.premierleague.com/premierleague/photos/players/110x140/${firstName}-${lastName}.png`,
        // FIFA official photos
        `https://cdn.sofifa.net/players/${firstName}_${lastName}.png`,
        // Transfermarkt (reliable source)
        `https://img.a.transfermarkt.technology/portrait/medium/${firstName}-${lastName}.jpg?lm=1`,
        // ESPN photos
        `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${firstName}_${lastName}.png`,
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

      // Skip 365Scores due to rate limiting and 425 errors
      // Focus on more reliable sources like API-Sports and Transfermarkt
    }

    // Source 4: Generate fallback avatar with player initials
    const fallbackUrl = "/attached_assets/fallback_player_1752379496642.png";

    console.log(`🎨 [PlayerPhotoByName] Generated fallback avatar for "${name}": ${fallbackUrl}`);

    // Redirect to the fallback avatar
    return res.redirect(302, fallbackUrl);

  } catch (error) {
    console.error(`❌ [PlayerPhotoByName] Error searching for "${name}":`, error);
    const fallbackUrl = "/attached_assets/fallback_player_1752379496642.png";
    return res.redirect(302, fallbackUrl);
  }
});

// Helper function to generate name variations
function generateNameVariations(name: string): string[] {
  const variations = [name]; // Original name first

  // Remove periods and abbreviations
  const withoutPeriods = name.replace(/\./g, '');
  if (withoutPeriods !== name) {
    variations.push(withoutPeriods);
  }

  // Common abbreviation expansions
  const expansions: { [key: string]: string[] } = {
    'L.': ['Luis', 'Lucas', 'Leonardo', 'Lorenzo'],
    'M.': ['Mario', 'Miguel', 'Manuel', 'Mateo', 'Martin']
  };

  // Try expanding abbreviations
  for (const [abbrev, fullNames] of Object.entries(expansions)) {
    if (name.includes(abbrev)) {
      for (const fullName of fullNames) {
        variations.push(name.replace(abbrev, fullName));
      }
    }
  }

  // Try without accents/special characters
  const withoutAccents = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (withoutAccents !== name) {
    variations.push(withoutAccents);
  }

  return [...new Set(variations)]; // Remove duplicates
}

// Known player ID mappings for popular players
function getKnownPlayerMappings(): { [key: string]: number } {
  return {
    'l. messi': 154,
    'lionel messi': 154,
    'messi': 154,
    'l. díaz': 2489,
    'luis díaz': 2489,
    'luis diaz': 2489,
    'm. terceros': 345756,
    'miguel terceros': 345756,
    'k. mbappé': 646,
    'kylian mbappé': 646,
    'erling haaland': 1100,
    'e. haaland': 1100
  };
}

// Generate fallback avatar with player initials
function generatePlayerFallbackAvatar(name: string): string {
  // Use the new player fallback image
  const fallbackUrl = '/attached_assets/fallback_player_1752379496642.png';

  console.log(`🎨 [PlayerPhotoByName] Generated fallback avatar for "${name}": ${fallbackUrl}`);
  return fallbackUrl;
}

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

    // 365Scores removed due to consistent 425 errors and rate limiting issues

    // No photo found
    res.status(404).json({ error: 'Player photo not found' });

  } catch (error) {
    console.error(`❌ [PlayerPhoto] Error fetching player ${playerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch player photo' });
  }
});

// Helper endpoint to get player ID for mapping purposes
router.get('/find-player-id', async (req, res) => {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid player name' });
  }

  try {
    const searchUrl = `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(name)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      },
      timeout: 5000,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.response && data.response.length > 0) {
        const players = data.response.slice(0, 5).map((p: any) => ({
          id: p.player.id,
          name: p.player.name,
          age: p.player.age,
          photo: p.player.photo,
          team: p.statistics[0]?.team?.name || 'Unknown',
          league: p.statistics[0]?.league?.name || 'Unknown'
        }));

        return res.json({ players });
      }
    }

    return res.json({ players: [] });
  } catch (error) {
    console.error(`Error finding player ID for "${name}":`, error);
    return res.status(500).json({ error: 'Failed to find player ID' });
  }
});

export default router;