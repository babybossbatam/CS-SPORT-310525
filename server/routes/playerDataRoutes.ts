
import express from 'express';

const router = express.Router();

// Player data endpoint using RapidAPI
router.post('/player-data', async (req, res) => {
  const { playerId, season } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }

  console.log(`🔍 [PlayerData] Fetching data for player ${playerId}, season ${season || '2025'}`);

  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/players?id=${playerId}&season=${season || '2025'}`,
      {
        headers: {
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527',
        },
        timeout: 10000,
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ [PlayerData] API request failed with status: ${response.status}`);
      throw new Error(`Failed to fetch player data: ${response.status}`);
    }

    const data = await response.json();
    const playerResponse = data.response?.[0];

    if (playerResponse) {
      console.log(`✅ [PlayerData] Found data for player ${playerId}`);
      
      const playerInfo = {
        id: playerResponse.player?.id,
        name: playerResponse.player?.name,
        photo: playerResponse.player?.photo,
        nationality: playerResponse.player?.nationality,
        position: playerResponse.statistics?.[0]?.games?.position,
        team: playerResponse.statistics?.[0]?.team
      };

      res.json({ player: playerInfo });
    } else {
      console.log(`❌ [PlayerData] No data found for player ${playerId}`);
      res.status(404).json({ error: 'Player not found' });
    }

  } catch (error) {
    console.error(`❌ [PlayerData] Error fetching player ${playerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

export default router;
