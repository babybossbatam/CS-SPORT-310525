
// Selective live data update routes - only returns essential live data
import express from 'express';
import { rapidApi } from '../services/rapidApi';

const router = express.Router();

// GET /api/fixtures/live/selective - Returns only essential live data (scores, status, elapsed)
router.get('/live/selective', async (req, res) => {
  try {
    console.log('🔴 [Selective Live] Fetching selective live updates');
    
    // Fetch full live data from RapidAPI
    const liveFixtures = await rapidApi.getLiveFixtures();
    
    if (!Array.isArray(liveFixtures)) {
      return res.json([]);
    }

    // Transform to selective data structure - only essential fields
    const selectiveData = liveFixtures.map(fixture => ({
      fixture: {
        id: fixture.fixture.id,
        status: {
          short: fixture.fixture.status.short,
          elapsed: fixture.fixture.status.elapsed
        }
      },
      goals: {
        home: fixture.goals.home,
        away: fixture.goals.away
      },
      league: {
        id: fixture.league.id
      }
    }));

    console.log(`🔴 [Selective Live] Returning ${selectiveData.length} selective updates`);
    
    res.json(selectiveData);
  } catch (error) {
    console.error('❌ [Selective Live] Error fetching selective live data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch selective live data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
