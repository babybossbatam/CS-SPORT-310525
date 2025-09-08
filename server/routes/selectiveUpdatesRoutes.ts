
import express from 'express';
import { rapidApiService } from '../services/rapidApi';

const router = express.Router();

// POST /api/fixtures/selective-updates - Returns only essential live data for specific fixture IDs
router.post('/selective-updates', async (req, res) => {
  try {
    const { fixtureIds } = req.body;
    
    if (!Array.isArray(fixtureIds) || fixtureIds.length === 0) {
      return res.json([]);
    }

    console.log(`🎯 [Selective Updates] Fetching selective updates for ${fixtureIds.length} fixtures:`, fixtureIds);
    
    // Fetch live fixtures first to get real-time data
    const liveFixtures = await rapidApiService.getLiveFixtures();
    
    // Filter live fixtures to match requested IDs
    const requestedLiveFixtures = liveFixtures.filter(fixture => 
      fixtureIds.includes(fixture.fixture.id)
    );

    // For non-live fixtures in the request, fetch their current status
    const nonLiveIds = fixtureIds.filter(id => 
      !requestedLiveFixtures.some(live => live.fixture.id === id)
    );

    let allFixtures = [...requestedLiveFixtures];

    // Fetch non-live fixtures if needed
    if (nonLiveIds.length > 0) {
      try {
        // Batch fetch non-live fixtures
        for (const fixtureId of nonLiveIds) {
          try {
            const fixture = await rapidApiService.getFixtureById(fixtureId);
            if (fixture) {
              allFixtures.push(fixture);
            }
          } catch (error) {
            console.warn(`Failed to fetch fixture ${fixtureId}:`, error);
          }
        }
      } catch (error) {
        console.warn('Error fetching non-live fixtures:', error);
      }
    }

    // Transform to selective data structure - only essential fields
    const selectiveData = allFixtures.map(fixture => ({
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
      timestamp: Date.now()
    }));

    console.log(`✅ [Selective Updates] Returning ${selectiveData.length} selective updates for fixtures: ${fixtureIds.join(', ')}`);
    
    res.json(selectiveData);
  } catch (error) {
    console.error('❌ [Selective Updates] Error fetching selective updates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch selective updates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
