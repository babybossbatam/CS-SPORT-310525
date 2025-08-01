
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Route to get head-to-head fixtures between two teams
router.get('/headtohead', async (req, res) => {
  try {
    const { h2h, season = '2025' } = req.query;
    
    console.log(`🔍 [H2H API] Raw query params:`, req.query);
    
    if (!h2h || typeof h2h !== 'string') {
      console.error(`❌ [H2H API] Missing or invalid h2h parameter:`, { h2h, type: typeof h2h });
      return res.status(400).json({ error: 'h2h parameter is required and must be a string like "33-34"' });
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

    console.log(`🌐 [H2H API] Making request to:`, url);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`❌ [H2H API] RapidAPI response not ok:`, response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `RapidAPI error: ${response.status} ${response.statusText}` 
      });
    }
    
    const result = await response.json();
    
    console.log(`✅ [H2H API] Successfully fetched head-to-head data. Results count:`, result?.results || 0);
    
    res.json(result);
  } catch (error) {
    console.error(`❌ [H2H API] Error fetching head-to-head data:`, error);
    res.status(500).json({ error: 'Failed to fetch head-to-head data', details: error.message });
  }
});

export default router;
