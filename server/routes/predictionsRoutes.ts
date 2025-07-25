
import express from 'express';

const router = express.Router();

// Get predictions for a specific fixture
router.get('/fixtures/:fixtureId/predictions', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    
    // Validate fixture ID
    if (!fixtureId || isNaN(Number(fixtureId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fixture ID provided',
        data: []
      });
    }
    
    console.log(`📊 [Predictions API] Fetching predictions for fixture: ${fixtureId}`);
    
    const apiKey = process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY || '';
    
    if (!apiKey) {
      console.error('❌ [Predictions API] RapidAPI key not found in environment variables');
      return res.status(500).json({
        success: false,
        message: 'API key not configured',
        data: []
      });
    }

    const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/predictions?fixture=${fixtureId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Predictions API] HTTP ${response.status}: ${response.statusText}`, errorText);
      
      if (response.status === 401) {
        return res.status(500).json({
          success: false,
          message: 'API authentication failed - please check API key configuration',
          data: []
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          message: 'API rate limit exceeded - please try again later',
          data: []
        });
      }
      
      return res.status(500).json({
        success: false,
        message: `API error: ${response.statusText}`,
        data: []
      });
    }

    const data = await response.json();
    
    console.log(`✅ [Predictions API] Retrieved ${data.response?.length || 0} predictions for fixture ${fixtureId}`);
    
    // Enhanced response structure to match your existing component expectations
    const formattedResponse = {
      success: true,
      data: data.response || [],
      message: `Found ${data.response?.length || 0} predictions`,
      fixtureId: fixtureId
    };
    
    res.json(formattedResponse);

  } catch (error) {
    console.error('❌ [Predictions API] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
      data: [],
      error: error.message
    });
  }
});

export default router;
