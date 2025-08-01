
import express from 'express';
import { rapidApiService } from '../services/rapidApi';

const router = express.Router();

// Route to get head-to-head fixtures between two teams
router.get('/headtohead', async (req, res) => {
  try {
    const { h2h, season = '2025' } = req.query;
    
    if (!h2h || typeof h2h !== 'string') {
      return res.status(400).json({ message: 'Invalid fixture ID' });
    }
    
    const [homeTeamId, awayTeamId] = h2h.split('-').map(id => parseInt(id));
    
    if (!homeTeamId || !awayTeamId) {
      return res.status(400).json({ message: 'Invalid team IDs in h2h parameter' });
    }
    
    console.log(`🔍 [H2H API] Fetching head-to-head data for teams: ${homeTeamId} vs ${awayTeamId}, season: ${season}`);
    
    // Use RapidAPI to get head-to-head data
    const apiClient = require('axios').create({
      baseURL: "https://api-football-v1.p.rapidapi.com/v3",
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY || "",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    });
    
    const response = await apiClient.get("/fixtures/headtohead", {
      params: {
        h2h: h2h,
        season: season
      }
    });
    
    console.log(`✅ [H2H API] Successfully fetched ${response.data?.results || 0} head-to-head matches`);
    
    res.json(response.data);
  } catch (error) {
    console.error(`❌ [H2H API] Error fetching head-to-head data:`, error);
    res.status(500).json({ error: 'Failed to fetch head-to-head data' });
  }
});

export default router;
