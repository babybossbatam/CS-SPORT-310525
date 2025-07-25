
import express from 'express';

const router = express.Router();

// GET /api/predictions/:fixtureId
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    if (!fixtureId) {
      return res.json({ 
        response: [],
        error: 'Fixture ID is required' 
      });
    }

    console.log(`🔮 [Predictions] Fetching prediction for fixture: ${fixtureId}`);

    const url = `https://api-football-v1.p.rapidapi.com/v3/predictions?fixture=${fixtureId}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`❌ [Predictions] RapidAPI error for fixture ${fixtureId}:`, response.status);
      return res.json({ 
        response: [],
        error: 'No prediction data available',
        status: response.status
      });
    }

    const result = await response.text();
    
    // Check if response is HTML (error page) instead of JSON
    if (result.trim().startsWith('<!DOCTYPE') || result.trim().startsWith('<html')) {
      console.error(`❌ [Predictions] Received HTML response instead of JSON for fixture ${fixtureId}`);
      return res.json({ 
        response: [],
        error: 'Prediction service temporarily unavailable'
      });
    }

    try {
      const data = JSON.parse(result);
      console.log(`✅ [Predictions] Successfully fetched prediction for fixture: ${fixtureId}`);
      res.json(data);
    } catch (parseError) {
      console.error(`❌ [Predictions] JSON parse error for fixture ${fixtureId}:`, parseError);
      return res.json({ 
        response: [],
        error: 'Invalid response format from prediction service'
      });
    }

  } catch (error) {
    console.error('❌ [Predictions] Error:', error);
    res.json({ 
      response: [],
      error: 'Failed to fetch prediction data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
