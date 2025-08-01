
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
    
    // Check if API key is available
    const apiKey = process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY || '';
    if (!apiKey) {
      console.error(`❌ [H2H API] No RapidAPI key found in environment variables`);
      return res.status(500).json({ error: 'RapidAPI key not configured' });
    }

    // Split the h2h parameter to get individual team IDs
    const teamIds = h2h.split('-');
    if (teamIds.length !== 2) {
      console.error(`❌ [H2H API] Invalid h2h format. Expected "team1-team2", got: ${h2h}`);
      return res.status(400).json({ error: 'h2h parameter must be in format "team1-team2"' });
    }

    const [team1, team2] = teamIds;
    console.log(`🔍 [H2H API] Parsed team IDs: ${team1} vs ${team2}`);

    // Use the correct RapidAPI format - pass team IDs separately
    const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${team1}-${team2}&season=${season}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };

    console.log(`🔑 [H2H API] Using API key: ${apiKey.substring(0, 8)}...`);
    console.log(`🌐 [H2H API] Making request to:`, url);
    console.log(`📋 [H2H API] Request params: h2h=${team1}-${team2}, season=${season}`);
    
    const response = await fetch(url, options);
    
    console.log(`📡 [H2H API] Response status: ${response.status}, statusText: ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [H2H API] RapidAPI error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`📋 [H2H API] Parsed error JSON:`, errorJson);
      } catch (e) {
        console.error(`📋 [H2H API] Could not parse error as JSON:`, errorText);
      }
      
      return res.status(response.status).json({ 
        error: `RapidAPI error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }
    
    const result = await response.json();
    
    console.log(`✅ [H2H API] Successfully fetched head-to-head data:`, {
      results: result?.results || 0,
      response_count: result?.response?.length || 0,
      sample_data: result?.response?.[0] ? {
        fixture_id: result.response[0].fixture?.id,
        teams: `${result.response[0].teams?.home?.name} vs ${result.response[0].teams?.away?.name}`,
        date: result.response[0].fixture?.date
      } : null
    });
    
    res.json(result);
  } catch (error) {
    console.error(`❌ [H2H API] Error fetching head-to-head data:`, error);
    res.status(500).json({ error: 'Failed to fetch head-to-head data', details: error.message });
  }
});

export default router;
