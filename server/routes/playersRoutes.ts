
import express from 'express';
import { rapidApiService } from '../services/rapidApi.js';

const router = express.Router();

// Get players by team and season
router.get('/players', async (req, res) => {
  try {
    const { team, season = new Date().getFullYear() } = req.query;

    if (!team) {
      return res.status(400).json({ 
        error: 'Team ID is required',
        response: []
      });
    }

    console.log(`🔍 [Players API] Fetching players for team ${team}, season ${season}`);

    // Use the existing rapidApi service method
    const playersData = await rapidApiService.getPlayerStatistics(
      undefined, // playerId - not needed when fetching by team
      parseInt(team as string),
      parseInt(season as string)
    );

    if (playersData && playersData.length > 0) {
      console.log(`✅ [Players API] Found ${playersData.length} players for team ${team}`);
      res.json({
        response: playersData,
        results: playersData.length
      });
    } else {
      console.log(`⚠️ [Players API] No players found for team ${team}, season ${season}`);
      res.json({
        response: [],
        results: 0
      });
    }

  } catch (error) {
    console.error(`❌ [Players API] Error fetching players:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch players',
      response: []
    });
  }
});

export default router;
