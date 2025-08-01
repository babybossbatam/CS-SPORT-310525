
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Route to get head-to-head fixtures between two teams
router.get('/headtohead', async (req, res) => {
  try {
    const { h2h, last = '10', season = '2025' } = req.query;
    
    console.log(`🔍 [H2H API] Request params:`, { h2h, last, season });
    
    if (!h2h) {
      return res.status(400).json({ error: 'h2h parameter is required (format: team1-team2)' });
    }

    // Validate h2h format (should be team1-team2)
    if (!h2h.toString().includes('-')) {
      return res.status(400).json({ error: 'h2h parameter must be in format: team1-team2' });
    }
    
    const apiKey = process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'RapidAPI key not configured' });
    }

    const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${h2h}&last=${last}&season=${season}`;
    
    console.log(`🌐 [H2H API] Fetching from:`, url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });
    
    console.log(`📡 [H2H API] Response status:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [H2H API] Error:`, response.status, errorText);
      return res.status(response.status).json({ 
        error: `API returned ${response.status}`,
        details: errorText
      });
    }
    
    const result = await response.json();
    console.log(`✅ [H2H API] Success: ${result?.response?.length || 0} matches found`);
    
    res.json(result);
  } catch (error) {
    console.error(`❌ [H2H API] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch head-to-head data', details: error.message });
  }
});

export default router;
