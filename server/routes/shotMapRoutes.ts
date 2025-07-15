
import express, { Request, Response } from "express";
import { sofaScoreMappingService } from "../services/sofaScoreMapping";

const shotMapRouter = express.Router();

// Get shot map data for a specific fixture
shotMapRouter.get("/fixtures/:fixtureId/shots", async (req: Request, res: Response) => {
  try {
    const { fixtureId } = req.params;
    const { homeTeam, awayTeam, matchDate } = req.query;

    if (!fixtureId) {
      return res.status(400).json({ error: 'Fixture ID is required' });
    }

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'Home team and away team names are required' });
    }

    console.log(`🎯 [ShotMapAPI] Fetching shot data for fixture ${fixtureId}`);
    console.log(`🏟️ [ShotMapAPI] Teams: ${homeTeam} vs ${awayTeam}`);
    console.log(`📅 [ShotMapAPI] Match date: ${matchDate}`);

    const shotData = await sofaScoreMappingService.getMappedShotData(
      fixtureId,
      homeTeam as string,
      awayTeam as string,
      matchDate as string
    );

    console.log(`✅ [ShotMapAPI] Returning ${shotData.length} shots for fixture ${fixtureId}`);
    
    // Log first shot for debugging
    if (shotData.length > 0) {
      console.log(`🔍 [ShotMapAPI] Sample shot data:`, {
        player: shotData[0].player,
        type: shotData[0].type,
        sofaScorePlayerId: shotData[0].sofaScorePlayerId,
        minute: shotData[0].minute
      });
    }
    res.json(shotData);

  } catch (error) {
    console.error(`❌ [ShotMapAPI] Error fetching shot data for fixture ${req.params.fixtureId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch shot data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear shot mapping cache
shotMapRouter.post("/cache/clear", async (req: Request, res: Response) => {
  try {
    sofaScoreMappingService.clearCache();
    res.json({ success: true, message: 'Shot mapping cache cleared' });
  } catch (error) {
    console.error(`❌ [ShotMapAPI] Error clearing cache:`, error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default shotMapRouter;
import express from 'express';
import { sofaScoreMappingService } from '../services/sofaScoreMapping';

const router = express.Router();

// GET /api/shot-map/fixtures/:fixtureId/shots
router.get('/fixtures/:fixtureId/shots', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const { homeTeam, awayTeam, matchDate } = req.query;

    console.log(`🎯 [ShotMapAPI] Fetching shots for fixture ${fixtureId}`);

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ 
        error: 'Missing required parameters: homeTeam and awayTeam' 
      });
    }

    // Use the mapping service to get SofaScore data
    const mappedShots = await sofaScoreMappingService.getMappedShotData(
      fixtureId,
      homeTeam as string,
      awayTeam as string,
      matchDate as string
    );

    if (mappedShots.length === 0) {
      console.log(`⚠️ [ShotMapAPI] No shots found for fixture ${fixtureId}`);
      return res.json([]);
    }

    console.log(`✅ [ShotMapAPI] Returning ${mappedShots.length} shots for fixture ${fixtureId}`);
    res.json(mappedShots);

  } catch (error) {
    console.error(`❌ [ShotMapAPI] Error fetching shots for fixture ${req.params.fixtureId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch shot data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
