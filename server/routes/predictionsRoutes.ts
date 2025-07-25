import express from 'express';

const router = express.Router();

// GET /api/predictions/:fixtureId
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    if (!fixtureId) {
      return res.status(400).json({ error: 'Fixture ID is required' });
    }

    console.log(`🔮 [Predictions] Fetching prediction for fixture: ${fixtureId}`);

    const url = `https://api-football-v1.p.rapidapi.com/v3/predictions?fixture=${fixtureId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ [Predictions] Successfully fetched prediction for fixture: ${fixtureId}`);
    res.json(data);

  } catch (error) {
    console.error('❌ [Predictions] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prediction data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;