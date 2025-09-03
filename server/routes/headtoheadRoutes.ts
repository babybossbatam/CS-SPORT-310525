
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Route to get head-to-head fixtures between two teams
router.get('/headtohead', async (req, res) => {
  try {
    const { h2h, last = '10', season } = req.query;
    
    console.log(`🔍 [H2H API] Request params:`, { h2h, last, season });
    
    if (!h2h) {
      console.log(`❌ [H2H API] Missing h2h parameter`);
      return res.status(400).json({ error: 'h2h parameter is required (format: team1-team2)' });
    }

    // Clean and validate h2h format (should be team1-team2)
    const cleanH2h = h2h.toString().trim();
    console.log(`🔍 [H2H API] Cleaned h2h parameter: "${cleanH2h}"`);
    
    if (!cleanH2h.includes('-')) {
      console.log(`❌ [H2H API] Invalid h2h format: ${cleanH2h}`);
      return res.status(400).json({ error: 'h2h parameter must be in format: team1-team2' });
    }
    
    // Validate that both team IDs are numbers
    const parts = cleanH2h.split('-');
    if (parts.length !== 2) {
      console.log(`❌ [H2H API] Invalid h2h format: ${cleanH2h}`);
      return res.status(400).json({ 
        error: 'h2h parameter must contain exactly two team IDs: team1-team2',
        received: cleanH2h
      });
    }
    
    const [team1, team2] = parts;
    if (!team1 || !team2 || isNaN(Number(team1)) || isNaN(Number(team2))) {
      console.log(`❌ [H2H API] Invalid team IDs: team1="${team1}", team2="${team2}"`);
      return res.status(400).json({ 
        error: 'h2h parameter must contain valid team IDs: team1-team2',
        received: cleanH2h,
        parsed: { team1, team2 }
      });
    }
    
    console.log(`✅ [H2H API] Valid team IDs: ${team1} vs ${team2}`);
    
    // More lenient validation - check if team IDs are reasonable
    const team1Num = Number(team1);
    const team2Num = Number(team2);
    if (team1Num < 1 || team1Num > 100000 || team2Num < 1 || team2Num > 100000) {
      console.log(`⚠️ [H2H API] Suspicious team IDs: ${team1} vs ${team2}`);
      return res.status(200).json({ 
        response: [],
        message: 'Invalid team IDs provided',
        teams: { team1: team1Num, team2: team2Num },
        suggestion: 'Team IDs must be between 1 and 100000',
        reason: 'Invalid team ID range'
      });
    }
    
    // Additional check for same team IDs
    if (team1Num === team2Num) {
      console.log(`⚠️ [H2H API] Same team IDs provided: ${team1Num}`);
      return res.status(200).json({ 
        response: [],
        message: 'Cannot get head-to-head data for the same team',
        teams: { team1: team1Num, team2: team2Num },
        suggestion: 'Provide two different team IDs',
        reason: 'Identical team IDs'
      });
    }
    
    const apiKey = process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'RapidAPI key not configured' });
    }

    // Build URL with proper parameters
    const baseUrl = 'https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead';
    const params = new URLSearchParams({
      h2h: cleanH2h
    });
    
    // Add last parameter (limit number of matches)
    if (last) {
      params.append('last', last.toString());
    }
    
    // Add season if provided
    if (season) {
      params.append('season', season.toString());
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
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
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        console.error(`❌ [H2H API] JSON Error:`, response.status, errorData);
        
        // Handle specific API error cases
        if (response.status === 400 || response.status === 404) {
          return res.status(200).json({ 
            response: [],
            message: 'No head-to-head data available between these teams',
            teams: { team1: team1, team2: team2 },
            suggestion: 'These teams may not have played against each other or do not exist in the database',
            reason: 'Invalid team combination or fixture ID'
          });
        }
      } catch {
        const errorText = await response.text();
        errorDetails = errorText;
        console.error(`❌ [H2H API] Text Error:`, response.status, errorText);
      }
      
      return res.status(response.status).json({ 
        error: `API returned ${response.status}`,
        details: errorDetails,
        url: url,
        teams: `${team1} vs ${team2}`
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

// Test endpoint to check if teams exist
router.get('/test-teams/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    
    console.log(`🧪 [H2H TEST] Testing teams: ${team1} vs ${team2}`);
    
    const apiKey = process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'RapidAPI key not configured' });
    }

    // Test both teams
    const team1InfoUrl = `https://api-football-v1.p.rapidapi.com/v3/teams?id=${team1}`;
    const team2InfoUrl = `https://api-football-v1.p.rapidapi.com/v3/teams?id=${team2}`;
    
    const [response1, response2] = await Promise.all([
      fetch(team1InfoUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      }),
      fetch(team2InfoUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      })
    ]);
    
    const [result1, result2] = await Promise.all([
      response1.json(),
      response2.json()
    ]);
    
    console.log(`🧪 [H2H TEST] Team ${team1} info:`, result1);
    console.log(`🧪 [H2H TEST] Team ${team2} info:`, result2);
    
    const team1Exists = result1?.response?.length > 0;
    const team2Exists = result2?.response?.length > 0;
    
    res.json({
      team1: {
        id: team1,
        exists: team1Exists,
        name: team1Exists ? result1.response[0].name : 'Not found',
        info: result1
      },
      team2: {
        id: team2,
        exists: team2Exists,
        name: team2Exists ? result2.response[0].name : 'Not found',
        info: result2
      },
      bothExist: team1Exists && team2Exists,
      canHaveH2H: team1Exists && team2Exists
    });
  } catch (error) {
    console.error(`❌ [H2H TEST] Error:`, error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

export default router;
