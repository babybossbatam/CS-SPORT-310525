import express from 'express';

const router = express.Router();

// Add the predictions route
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    if (!fixtureId) {
      return res.status(400).json({ error: 'Fixture ID is required' });
    }

    console.log(`📊 [Predictions] Fetching predictions for fixture: ${fixtureId}`);

    const response = await fetch(
      `https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ [Predictions] API request failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: 'Failed to fetch predictions from API',
        details: `${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    console.log(`✅ [Predictions] Successfully fetched predictions for fixture ${fixtureId}:`, {
      results: data.results,
      hasResponse: !!data.response,
      responseLength: data.response?.length || 0
    });

    if (!data.response || data.response.length === 0) {
      console.log(`⚠️ [Predictions] No predictions found for fixture ${fixtureId}:`, data);
      return res.status(404).json({ 
        error: 'No predictions available for this fixture',
        fixtureId: fixtureId,
        apiResponse: data
      });
    }

    res.json(data.response);
  } catch (error) {
    console.error('❌ [Predictions] Error fetching predictions:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add route for testing specific fixture
router.get('/test/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    console.log(`🧪 [Predictions Test] Testing predictions for fixture: ${fixtureId}`);

    const response = await fetch(
      `https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`,
      {
        method: 'GET',  
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      }
    );

    const data = await response.json();
    console.log(`🧪 [Predictions Test] Full API response:`, JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    console.error('❌ [Predictions Test] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;