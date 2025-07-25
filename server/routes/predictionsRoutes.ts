import express from 'express';

const router = express.Router();

// Get predictions for a specific fixture
router.get('/predictions/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    console.log(`📊 [Predictions] Fetching predictions for fixture: ${fixtureId}`);

    // Using fetch instead of request library for ES module compatibility
    // const request = require('request'); // This causes "require is not defined" error

    const url = new URL('https://api-football-v1.p.rapidapi.com/v3/predictions');
    url.searchParams.append('fixture', fixtureId.toString());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      });

      // Check HTTP status
      if (!response.ok) {
        console.error(`❌ [Predictions] HTTP error: ${response.status}`);
        const errorText = await response.text();
        console.log('❌ [Predictions] Error response body:', errorText.substring(0, 200));
        return res.status(response.status).json({ 
          success: false, 
          error: `API returned status ${response.status}`,
          data: null 
        });
      }

      const responseText = await response.text();
      
      // Check if response is HTML (error page)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('❌ [Predictions] Received HTML response instead of JSON');
        console.log('❌ [Predictions] HTML response:', responseText.substring(0, 200));
        return res.status(500).json({ 
          success: false, 
          error: 'API returned HTML error page',
          data: null 
        });
      }

      try {
        const data = JSON.parse(responseText);
        console.log(`✅ [Predictions] Successfully fetched predictions for fixture ${fixtureId}:`, data);
        
        // Return in expected format
        res.json({
          success: true,
          data: data.response || data,
          error: null
        });
      } catch (parseError) {
        console.error('❌ [Predictions] JSON parse error:', parseError);
        console.log('❌ [Predictions] Raw response body:', responseText.substring(0, 200));
        res.status(500).json({ 
          success: false, 
          error: 'Invalid JSON response from API',
          data: null 
        });
      }
    } catch (fetchError) {
      console.error('❌ [Predictions] Fetch error:', fetchError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch predictions',
        data: null 
      });
    }

  } catch (error) {
    console.error('❌ [Predictions] Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;