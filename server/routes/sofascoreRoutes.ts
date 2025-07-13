
import express from 'express';
import axios from 'axios';

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527';

// Get player heatmap data
router.get('/player-heatmap/:matchId/:playerId', async (req, res) => {
  try {
    const { matchId, playerId } = req.params;
    
    console.log(`🔥 [SofaScore] Fetching heatmap for player ${playerId} in match ${matchId}`);
    
    const response = await axios.get('https://sofascore.p.rapidapi.com/matches/get-player-heatmap', {
      params: {
        matchId,
        playerId
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'sofascore.p.rapidapi.com'
      },
      timeout: 10000
    });

    if (response.data) {
      console.log(`✅ [SofaScore] Successfully fetched heatmap data for player ${playerId}`);
      res.json(response.data);
    } else {
      console.log(`⚠️ [SofaScore] No heatmap data found for player ${playerId}`);
      res.status(404).json({ error: 'No heatmap data found' });
    }
  } catch (error) {
    console.error(`❌ [SofaScore] Error fetching heatmap:`, error);
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Heatmap data not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
  }
});

export default router;
