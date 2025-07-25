import express from 'express';

const router = express.Router();

// Get predictions for a specific fixture
router.get('/predictions/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    console.log(`📊 [Predictions] Fetching predictions for fixture: ${fixtureId}`);

    const request = require('request');

    const options = {
      method: 'GET',
      url: 'https://api-football-v1.p.rapidapi.com/v3/predictions',
      qs: { fixture: fixtureId }, // Using the dynamic fixture ID from request parameter
      headers: {
        'x-rapidapi-key': '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };

    request(options, function (error: any, response: any, body: any) {
      if (error) {
        console.error('❌ [Predictions] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch predictions' });
      }

      try {
        const data = JSON.parse(body);
        console.log(`✅ [Predictions] Successfully fetched predictions for fixture ${fixtureId}`);
        res.json(data);
      } catch (parseError) {
        console.error('❌ [Predictions] JSON parse error:', parseError);
        res.status(500).json({ error: 'Invalid response format' });
      }
    });

  } catch (error) {
    console.error('❌ [Predictions] Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;