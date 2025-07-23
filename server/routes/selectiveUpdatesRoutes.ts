import express from 'express';
import { rapidApiService } from '../services/rapidApi';

const router = express.Router();

/**
 * POST /api/fixtures/selective-updates
 * Get selective updates for specific fixture IDs
 * Only returns scores, status, and elapsed time
 */
router.post('/selective-updates', async (req, res) => {
  try {
    const { fixtureIds, bypassCache } = req.body;

    if (!Array.isArray(fixtureIds) || fixtureIds.length === 0) {
      return res.status(400).json({ error: 'fixtureIds array is required' });
    }

    console.log(`🎯 [SelectiveUpdates] Fetching updates for ${fixtureIds.length} fixtures${bypassCache ? ' (CACHE BYPASS)' : ''}`);

    // Add cache control headers for live data
    if (bypassCache) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }

    // Fetch live fixtures from API
    const response = await rapidApiService.getLiveFixtures(bypassCache);

    if (!response || !Array.isArray(response)) {
      return res.status(500).json({ error: 'Invalid API response' });
    }

    // Filter to only requested fixtures and return minimal data
    const updates = response
      .filter((fixture: any) => fixtureIds.includes(fixture.fixture.id))
      .map((fixture: any) => ({
        fixture: {
          id: fixture.fixture.id,
          status: {
            short: fixture.fixture.status.short,
            elapsed: fixture.fixture.status.elapsed,
          },
        },
        goals: {
          home: fixture.goals.home,
          away: fixture.goals.away,
        },
      }));

    console.log(`✅ [SelectiveUpdates] Returning ${updates.length} updates`);

    res.json(updates);
  } catch (error) {
    console.error('Error fetching selective updates:', error);
    res.status(500).json({ error: 'Failed to fetch selective updates' });
  }
});

export default router;