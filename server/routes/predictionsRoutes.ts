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
        console.error('❌ [Predictions] Request error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch predictions',
          data: null 
        });
      }

      // Check if response is HTML (error page)
      if (typeof body === 'string' && (body.startsWith('<!DOCTYPE') || body.startsWith('<html'))) {
        console.error('❌ [Predictions] Received HTML response instead of JSON');
        console.log('❌ [Predictions] HTML response:', body.substring(0, 200));
        return res.status(500).json({ 
          success: false, 
          error: 'API returned HTML error page',
          data: null 
        });
      }

      // Check HTTP status
      if (response.statusCode !== 200) {
        console.error(`❌ [Predictions] HTTP error: ${response.statusCode}`);
        console.log('❌ [Predictions] Response body:', body);
        return res.status(response.statusCode).json({ 
          success: false, 
          error: `API returned status ${response.statusCode}`,
          data: null 
        });
      }

      try {
        const data = JSON.parse(body);
        console.log(`✅ [Predictions] Successfully fetched predictions for fixture ${fixtureId}:`, data);
        
        // Return in expected format
        res.json({
          success: true,
          data: data.response || data,
          error: null
        });
      } catch (parseError) {
        console.error('❌ [Predictions] JSON parse error:', parseError);
        console.log('❌ [Predictions] Raw response body:', body.substring(0, 200));
        res.status(500).json({ 
          success: false, 
          error: 'Invalid JSON response from API',
          data: null 
        });
      }
    });

  } catch (error) {
    console.error('❌ [Predictions] Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;