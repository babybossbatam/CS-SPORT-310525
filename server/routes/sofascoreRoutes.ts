
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get player heatmap data from SofaScore
router.get('/matches/:matchId/players/:playerId/heatmap', async (req, res) => {
  const { matchId, playerId } = req.params;

  if (!matchId || !playerId) {
    return res.status(400).json({ error: 'Match ID and Player ID are required' });
  }

  try {
    console.log(`🔥 [SofaScore] Fetching heatmap for match ${matchId}, player ${playerId}`);

    const response = await fetch(
      `https://sofascore.p.rapidapi.com/matches/get-player-heatmap?matchId=${matchId}&playerId=${playerId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || '',
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ [SofaScore] Heatmap API request failed with status: ${response.status}`);
      return res.status(response.status).json({ 
        error: `Failed to fetch heatmap data: ${response.status}` 
      });
    }

    const heatmapData = await response.json();
    
    console.log(`✅ [SofaScore] Successfully fetched heatmap data for player ${playerId}`);
    res.json({
      success: true,
      data: heatmapData,
      matchId,
      playerId
    });

  } catch (error) {
    console.error(`❌ [SofaScore] Error fetching heatmap:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch heatmap data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get player shot map data from SofaScore (if available)
router.get('/matches/:matchId/players/:playerId/shotmap', async (req, res) => {
  const { matchId, playerId } = req.params;

  if (!matchId || !playerId) {
    return res.status(400).json({ error: 'Match ID and Player ID are required' });
  }

  try {
    console.log(`⚽ [SofaScore] Fetching shot map for match ${matchId}, player ${playerId}`);

    // Note: This endpoint might not exist in SofaScore API, but we'll try
    const response = await fetch(
      `https://sofascore.p.rapidapi.com/matches/get-player-shotmap?matchId=${matchId}&playerId=${playerId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || '',
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ [SofaScore] Shot map API request failed with status: ${response.status}`);
      return res.status(404).json({ 
        error: 'Shot map data not available',
        message: 'This endpoint may not be supported by SofaScore API'
      });
    }

    const shotMapData = await response.json();
    
    console.log(`✅ [SofaScore] Successfully fetched shot map data for player ${playerId}`);
    res.json({
      success: true,
      data: shotMapData,
      matchId,
      playerId
    });

  } catch (error) {
    console.error(`❌ [SofaScore] Error fetching shot map:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch shot map data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
