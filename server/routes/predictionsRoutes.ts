
import express from 'express';

const router = express.Router();

// Get predictions for a specific fixture
router.get('/fixtures/:fixtureId/predictions', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    
    console.log(`📊 [Predictions API] Fetching predictions for fixture: ${fixtureId}`);
    
    const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/predictions?fixture=${fixtureId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`❌ [Predictions API] HTTP ${response.status}: ${response.statusText}`);
      return res.status(response.status).json({
        success: false,
        message: `RapidAPI error: ${response.statusText}`,
        data: []
      });
    }

    const data = await response.json();
    
    console.log(`✅ [Predictions API] Retrieved ${data.response?.length || 0} predictions for fixture ${fixtureId}`);
    
    res.json({
      success: true,
      data: data.response || [],
      message: `Found ${data.response?.length || 0} predictions`
    });

  } catch (error) {
    console.error('❌ [Predictions API] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
      data: []
    });
  }
});

export default router;
