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

    // Source 1: Try direct API-Sports URL first (most reliable)
    // Try using known player ID mappings first
    const knownMappings = getKnownPlayerMappings();
    const lowerName = name.toLowerCase();
    if (knownMappings[lowerName]) {
      const knownId = knownMappings[lowerName];
      const apiSportsUrl = `https://media.api-sports.io/football/players/${knownId}.png`;
      try {
        const testResponse = await fetch(apiSportsUrl, { method: 'HEAD', timeout: 3000 });
        if (testResponse.ok && testResponse.headers.get('content-type')?.startsWith('image/')) {
          console.log(`✅ [PlayerPhotoByName] Found via known mapping for "${name}": ${apiSportsUrl}`);
          return res.redirect(apiSportsUrl);
        }
      } catch (error) {
        console.log(`⚠️ [PlayerPhotoByName] Known mapping failed for "${name}"`);
      }
    }

    // Source 2: Try RapidAPI search with multiple name variations
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
        console.log(`⚠️ [PlayerPhotoByName] RapidAPI error for "${name}" (variation: "${variation}"):`, error?.message || error);
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
    const fallbackUrl = generatePlayerFallbackAvatar(name);
    console.log(`🎨 [PlayerPhotoByName] Generated fallback avatar for "${name}": ${fallbackUrl}`);
    return res.redirect(fallbackUrl);

  } catch (error) {
    console.error(`❌ [PlayerPhotoByName] Error searching for "${name}":`, error);
    const fallbackUrl = generatePlayerFallbackAvatar(name);
    return res.redirect(fallbackUrl);
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
    's. rondón': 1113,
    'salomon rondon': 1113,
    'salomón rondón': 1113,
    'g. cano': 13523,
    'german cano': 13523,
    'germán cano': 13523,
    'a. canobbio': 51603,
    'agustin canobbio': 51603,
    'agustín canobbio': 51603,
    'k. serna': 70849,
    'kevin serna': 70849,
    'breno lopes': 35551,
    'a. bareiro': 35551,
    'adam bareiro': 35551,
    'matheus rossetto': 10138,
    'lima': 50532,
    'ph ganso': 10311,
    'paulo henrique ganso': 10311,
    'everaldo': 10222,
    'allanzinho': 276445,
    'yago pikachu': 10120,
    'j. herrera': 51074,
    'jose herrera': 51074,
    'josé herrera': 51074,
    'deyverson': 9669,
    'j. lucero': 7899,
    'juan martin lucero': 7899,
    'juan martín lucero': 7899,
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
  const initials = name
    .split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
  
  // Use a more reliable fallback URL that matches what the frontend expects
  return `/assets/fallback-logo.png`;
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