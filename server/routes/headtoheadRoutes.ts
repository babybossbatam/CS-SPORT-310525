
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Route to get head-to-head fixtures between two teams
router.get('/headtohead', async (req, res) => {
  try {
    const { h2h, season = '2025' } = req.query;
    
    if (!h2h || typeof h2h !== 'string') {
      return res.status(400).json({ message: 'h2h parameter is required' });
    }
    
    console.log(`🔍 [H2H API] Fetching head-to-head data for: ${h2h}, season: ${season}`);
    
    // Direct RapidAPI call - exactly like your example
    const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${h2h}&season=${season}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPID_API_KEY || '',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`✅ [H2H API] Successfully fetched head-to-head data:`, result);
    
    res.json(result);
  } catch (error) {
    console.error(`❌ [H2H API] Error fetching head-to-head data:`, error);
    res.status(500).json({ error: 'Failed to fetch head-to-head data', details: error.message });
  }
});

export default router;
