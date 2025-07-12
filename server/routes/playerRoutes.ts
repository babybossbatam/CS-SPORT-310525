import { Router } from 'express';
import { rapidApiService } from '../services/rapidApi';

const router = Router();

/**
 * Get player photo from RapidAPI players endpoint with team ID priority
 */
router.get('/player-photo/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { teamId, season = '2024' } = req.query;

    console.log(`📷 [Player Photo API] Fetching photo for player ${playerId}, team ${teamId}, season ${season}`);

    // Priority 1: Try with team ID if provided
    if (teamId) {
      try {
        const playerDataWithTeam = await rapidApiService.getPlayerStatistics(
          parseInt(playerId), 
          parseInt(teamId as string), 
          parseInt(season as string)
        );

        if (playerDataWithTeam && playerDataWithTeam.length > 0) {
          const player = playerDataWithTeam[0];
          const photoUrl = player.player?.photo;

          if (photoUrl && photoUrl !== '') {
            console.log(`✅ [Player Photo API] Found photo URL with team ${teamId} for player ${playerId}: ${photoUrl}`);

            // Validate the photo URL before redirecting
            try {
              const response = await fetch(photoUrl, { method: 'HEAD', timeout: 5000 });
              if (response.ok) {
                return res.redirect(photoUrl);
              }
            } catch (validateError) {
              console.log(`⚠️ [Player Photo API] Photo URL validation failed: ${validateError}`);
            }
          }
        }
      } catch (teamError) {
        console.log(`⚠️ [Player Photo API] Team-specific request failed: ${teamError}`);
      }
    }

    // Priority 2: Try without team ID
    try {
      const playerData = await rapidApiService.getPlayerStatistics(
        parseInt(playerId), 
        undefined, 
        parseInt(season as string)
      );

      if (playerData && playerData.length > 0) {
        const player = playerData[0];
        const photoUrl = player.player?.photo;

        if (photoUrl && photoUrl !== '') {
          console.log(`✅ [Player Photo API] Found photo URL for player ${playerId}: ${photoUrl}`);

          // Validate the photo URL before redirecting
          try {
            const response = await fetch(photoUrl, { method: 'HEAD', timeout: 5000 });
            if (response.ok) {
              return res.redirect(photoUrl);
            }
          } catch (validateError) {
            console.log(`⚠️ [Player Photo API] Photo URL validation failed: ${validateError}`);
          }
        }
      }
    } catch (generalError) {
      console.log(`⚠️ [Player Photo API] General request failed: ${generalError}`);
    }

    // Priority 3: Try multiple seasons if current season fails
    const fallbackSeasons = ['2023', '2022', '2021'];

    for (const fallbackSeason of fallbackSeasons) {
      try {
        console.log(`📷 [Player Photo API] Trying fallback season ${fallbackSeason} for player ${playerId}`);

        const playerDataFallback = await rapidApiService.getPlayerStatistics(
          parseInt(playerId), 
          teamId ? parseInt(teamId as string) : undefined, 
          parseInt(fallbackSeason)
        );

        if (playerDataFallback && playerDataFallback.length > 0) {
          const player = playerDataFallback[0];
          const photoUrl = player.player?.photo;

          if (photoUrl && photoUrl !== '') {
            console.log(`✅ [Player Photo API] Found photo URL with season ${fallbackSeason} for player ${playerId}: ${photoUrl}`);

            try {
              const response = await fetch(photoUrl, { method: 'HEAD', timeout: 5000 });
              if (response.ok) {
                return res.redirect(photoUrl);
              }
            } catch (validateError) {
              console.log(`⚠️ [Player Photo API] Fallback photo URL validation failed: ${validateError}`);
            }
          }
        }
      } catch (fallbackError) {
        console.log(`⚠️ [Player Photo API] Fallback season ${fallbackSeason} failed: ${fallbackError}`);
        continue;
      }
    }

    console.log(`❌ [Player Photo API] No photo found for player ${playerId} after all attempts`);

    // Return 404 if no photo found
    res.status(404).json({ 
      error: 'Player photo not found',
      playerId: playerId,
      teamId: teamId,
      season: season
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