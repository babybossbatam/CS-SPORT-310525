
import express from 'express';

const router = express.Router();

// Proxy endpoint for 365Scores athlete data
router.get('/365scores-athlete', async (req, res) => {
  const { playerId, competitionId, timezone } = req.query;

  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }

  try {
    console.log(`🔍 [365Scores Proxy] Fetching athlete data for player ${playerId}`);

    const url = `https://webws.365scores.com/web/athletes/?appTypeId=5&langId=1&timezoneName=${encodeURIComponent(timezone as string || 'Asia/Manila')}&athletes=${playerId}&competitionId=${competitionId || 104}&fullDetails=true`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.365scores.com/',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      console.warn(`⚠️ [365Scores Proxy] API request failed with status: ${response.status}`);
      return res.status(response.status).json({ error: `Failed to fetch athlete data: ${response.status}` });
    }

    const data = await response.json();
    console.log(`✅ [365Scores Proxy] Successfully fetched athlete data for player ${playerId}`);

    res.json(data);

  } catch (error) {
    console.error(`❌ [365Scores Proxy] Error fetching athlete data:`, error);
    res.status(500).json({ error: 'Failed to fetch athlete data' });
  }
});

export default router;
