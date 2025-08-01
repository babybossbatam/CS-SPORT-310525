
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Route to get head-to-head fixtures between two teams
router.get('/headtohead', async (req, res) => {
  try {
    const { team1, team2, last = '10', season, date, league, next, from, to, venue, status, timezone } = req.query;
    
    console.log(`🔍 [H2H API] Raw query params:`, req.query);
    
    if (!team1 || !team2) {
      console.error(`❌ [H2H API] Missing team parameters:`, { team1, team2 });
      return res.status(400).json({ error: 'team1 and team2 parameters are required' });
    }
    
    console.log(`🔍 [H2H API] Fetching head-to-head data for: ${team1} vs ${team2}, last ${last} matches`);
    
    // Check if API key is available
    const apiKey = process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY || '';
    if (!apiKey) {
      console.error(`❌ [H2H API] No RapidAPI key found in environment variables`);
      return res.status(500).json({ error: 'RapidAPI key not configured' });
    }

    // Build query parameters according to RapidAPI documentation
    const queryParams = new URLSearchParams();
    queryParams.append('h2h', `${team1}-${team2}`);
    
    // Add optional parameters if provided
    if (last) queryParams.append('last', last.toString());
    if (season) queryParams.append('season', season.toString());
    if (date) queryParams.append('date', date.toString());
    if (league) queryParams.append('league', league.toString());
    if (next) queryParams.append('next', next.toString());
    if (from) queryParams.append('from', from.toString());
    if (to) queryParams.append('to', to.toString());
    if (venue) queryParams.append('venue', venue.toString());
    if (status) queryParams.append('status', status.toString());
    if (timezone) queryParams.append('timezone', timezone.toString());

    const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?${queryParams.toString()}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };

    console.log(`🔑 [H2H API] Using API key: ${apiKey.substring(0, 8)}...`);
    console.log(`🌐 [H2H API] Making request to:`, url);
    console.log(`📋 [H2H API] Request params:`, Object.fromEntries(queryParams));
    
    const response = await fetch(url, options);
    
    console.log(`📡 [H2H API] Response status: ${response.status}, statusText: ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [H2H API] RapidAPI error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
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
