
import { Router } from 'express';
import uefaU21ApiService from '../services/uefaU21Api.js';

const router = Router();

// Get real-time UEFA U21 matches
router.get('/realtime', async (req, res) => {
  try {
    console.log('🎯 [UEFA U21 Routes] Fetching real-time U21 matches');
    const matches = await uefaU21ApiService.getRealU21Matches();
    
    console.log(`🎯 [UEFA U21 Routes] Returning ${matches.length} real-time fixtures`);
    res.json(matches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error fetching real-time matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real-time UEFA U21 matches',
      details: error.message 
    });
  }
});

// Get upcoming UEFA U21 matches
router.get('/upcoming', async (req, res) => {
  try {
    console.log('🎯 [UEFA U21 Routes] Fetching upcoming U21 matches');
    const matches = await uefaU21ApiService.getUpcomingU21Matches();
    
    console.log(`🎯 [UEFA U21 Routes] Returning ${matches.length} upcoming fixtures`);
    res.json(matches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error fetching upcoming matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upcoming UEFA U21 matches',
      details: error.message 
    });
  }
});

// Get recent UEFA U21 matches
router.get('/recent', async (req, res) => {
  try {
    console.log('🎯 [UEFA U21 Routes] Fetching recent U21 matches');
    const matches = await uefaU21ApiService.getRecentU21Matches();
    
    console.log(`🎯 [UEFA U21 Routes] Returning ${matches.length} recent fixtures`);
    res.json(matches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error fetching recent matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent UEFA U21 matches',
      details: error.message 
    });
  }
});

// Get current season fixtures
router.get('/season/current', async (req, res) => {
  try {
    console.log('🎯 [UEFA U21 Routes] Fetching current season fixtures');
    const matches = await uefaU21ApiService.getCurrentSeasonU21Fixtures();
    
    console.log(`🎯 [UEFA U21 Routes] Returning ${matches.length} season fixtures`);
    res.json(matches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error fetching season fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current season UEFA U21 fixtures',
      details: error.message 
    });
  }
});

// Get live UEFA U21 matches
router.get('/live', async (req, res) => {
  try {
    console.log('🎯 [UEFA U21 Routes] Fetching live U21 matches');
    const matches = await uefaU21ApiService.getLiveU21Matches();
    
    console.log(`🎯 [UEFA U21 Routes] Returning ${matches.length} live fixtures`);
    res.json(matches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error fetching live matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live UEFA U21 matches',
      details: error.message 
    });
  }
});

// Search matches by teams
router.get('/search', async (req, res) => {
  try {
    const { home, away } = req.query;
    
    if (!home || !away) {
      return res.status(400).json({ 
        error: 'Both home and away team parameters are required' 
      });
    }
    
    console.log(`🎯 [UEFA U21 Routes] Searching for ${home} vs ${away}`);
    const matches = await uefaU21ApiService.searchU21MatchesByTeams(
      home as string, 
      away as string
    );
    
    console.log(`🎯 [UEFA U21 Routes] Found ${matches.length} matches`);
    res.json(matches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error searching matches:', error);
    res.status(500).json({ 
      error: 'Failed to search UEFA U21 matches',
      details: error.message 
    });
  }
});

// Keep the sample endpoint for testing
router.get('/sample', async (req, res) => {
  try {
    console.log('🎯 [UEFA U21 Routes] Fetching sample U21 matches');
    
    // Sample data for testing
    const sampleMatches = [
      {
        fixture: {
          id: 999001,
          date: "2025-06-16T16:00:00.000Z",
          status: { long: "Not Started", short: "NS" },
          venue: { name: "Arena Națională", city: "Bucharest" }
        },
        league: {
          id: 38,
          name: "UEFA European Under-21 Championship",
          logo: "https://media.api-sports.io/football/leagues/38.png",
          country: "Europe"
        },
        teams: {
          home: { id: 1111, name: "Spain U21", logo: "https://hatscripts.github.io/circle-flags/flags/es.svg" },
          away: { id: 2222, name: "Romania U21", logo: "https://hatscripts.github.io/circle-flags/flags/ro.svg" }
        },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } }
      }
    ];
    
    console.log(`🎯 [UEFA U21 Routes] Returning ${sampleMatches.length} sample fixtures`);
    res.json(sampleMatches);
  } catch (error: any) {
    console.error('❌ [UEFA U21 Routes] Error fetching sample matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sample UEFA U21 matches',
      details: error.message 
    });
  }
});

export default router;
