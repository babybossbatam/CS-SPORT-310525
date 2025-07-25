
import express from 'express';

const router = express.Router();

// Get predictions for a specific fixture
router.get('/predictions/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    // Validate fixtureId
    if (!fixtureId || isNaN(Number(fixtureId))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid fixture ID provided',
        data: null 
      });
    }

    console.log(`📊 [Predictions] Fetching predictions for fixture: ${fixtureId}`);

    // Build the API URL
    const apiUrl = `https://api-football-v1.p.rapidapi.com/v3/predictions?fixture=${fixtureId}`;
    
    // API headers
    const headers = {
      'x-rapidapi-key': '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      console.log(`📊 [Predictions] Making request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      console.log(`📊 [Predictions] Response status: ${response.status}`);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Predictions] HTTP error ${response.status}:`, errorText.substring(0, 200));
        
        return res.status(response.status).json({ 
          success: false, 
          error: `RapidAPI returned status ${response.status}`,
          data: null 
        });
      }

      // Get response text first to check if it's valid JSON
      const responseText = await response.text();
      console.log(`📊 [Predictions] Response length: ${responseText.length} chars`);
      console.log(`📊 [Predictions] Response preview:`, responseText.substring(0, 100));

      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('❌ [Predictions] Received HTML response instead of JSON');
        return res.status(502).json({ 
          success: false, 
          error: 'RapidAPI returned HTML error page - service may be down',
          data: null 
        });
      }

      // Check if response is empty
      if (!responseText.trim()) {
        console.error('❌ [Predictions] Empty response from RapidAPI');
        return res.status(502).json({ 
          success: false, 
          error: 'Empty response from prediction service',
          data: null 
        });
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log(`✅ [Predictions] Successfully parsed JSON response`);
      } catch (parseError) {
        console.error('❌ [Predictions] JSON parse error:', parseError);
        console.log('❌ [Predictions] Raw response:', responseText.substring(0, 300));
        return res.status(502).json({ 
          success: false, 
          error: 'Invalid JSON response from prediction service',
          data: null 
        });
      }

      // Log the structure of the response
      console.log(`📊 [Predictions] Response structure:`, {
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
        hasResults: !!data.results,
        results: data.results,
        hasErrors: !!data.errors,
        errors: data.errors
      });

      // Check for API errors
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('❌ [Predictions] RapidAPI errors:', data.errors);
        return res.status(400).json({ 
          success: false, 
          error: `RapidAPI error: ${Object.values(data.errors)[0]}`,
          data: null 
        });
      }

      // Return successful response
      console.log(`✅ [Predictions] Successfully fetched predictions for fixture ${fixtureId}`);
      
      res.json({
        success: true,
        data: data.response || [],
        meta: {
          fixtureId: fixtureId,
          results: data.results || 0,
          source: 'rapidapi'
        }
      });

    } catch (fetchError) {
      console.error('❌ [Predictions] Network/Fetch error:', fetchError);
      return res.status(503).json({ 
        success: false, 
        error: 'Failed to connect to prediction service',
        data: null 
      });
    }

  } catch (routeError) {
    console.error('❌ [Predictions] Route error:', routeError);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error in predictions route',
      data: null 
    });
  }
});

export default router;
