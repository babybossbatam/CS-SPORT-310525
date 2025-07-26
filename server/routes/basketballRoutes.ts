import express from 'express';
import { basketballApiService } from '../services/basketballApiService';

const router = express.Router();

/**
 * GET /api/basketball/leagues/:leagueId/fixtures
 * Get fixtures for a specific basketball league
 */
router.get('/leagues/:leagueId/fixtures', async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId);

    if (!leagueId || isNaN(leagueId)) {
      return res.status(400).json({ error: 'Valid league ID is required' });
    }

    console.log(`🏀 [BasketballRoutes] Fetching fixtures for league ${leagueId}`);

    const fixtures = await basketballApiService.getLeagueFixtures(leagueId);

    res.json(fixtures);
  } catch (error) {
    console.error('Error fetching basketball league fixtures:', error);
    res.status(500).json({ error: 'Failed to fetch basketball fixtures' });
  }
});

/**
 * GET /api/basketball/live
 * Get live basketball fixtures
 */
router.get('/live', async (req, res) => {
  try {
    console.log(`🔴 [BasketballRoutes] Fetching live basketball fixtures`);

    const fixtures = await basketballApiService.getLiveFixtures();

    res.json(fixtures);
  } catch (error) {
    console.error('Error fetching live basketball fixtures:', error);
    res.status(500).json({ error: 'Failed to fetch live basketball fixtures' });
  }
});

/**
 * GET /api/basketball/fixtures
 * Get basketball fixtures by date
 */
router.get('/fixtures', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    console.log(`🗓️ [BasketballRoutes] Fetching fixtures for date: ${date}`);

    const fixtures = await basketballApiService.getFixturesByDate(date);

    res.json(fixtures);
  } catch (error) {
    console.error('Error fetching basketball fixtures by date:', error);
    res.status(500).json({ error: 'Failed to fetch basketball fixtures' });
  }
});

/**
 * GET /api/basketball/leagues
 * Get all available basketball leagues
 */
router.get('/leagues', async (req, res) => {
  try {
    console.log(`🏀 [BasketballRoutes] Fetching all basketball leagues`);

    const leagues = await basketballApiService.getAllLeagues();

    res.json(leagues);
  } catch (error) {
    console.error('Error fetching basketball leagues:', error);
    res.status(500).json({ error: 'Failed to fetch basketball leagues' });
  }
});

/**
 * GET /api/basketball/test
 * Test basketball API connection
 */
router.get('/test', async (req, res) => {
  try {
    console.log(`🧪 [BasketballRoutes] Testing basketball API connection`);

    const isWorking = await basketballApiService.testConnection();

    res.json({
      status: isWorking ? 'success' : 'failed',
      message: isWorking ? 'Basketball API is working' : 'Basketball API failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing basketball API:', error);
    res.status(500).json({ error: 'Failed to test basketball API' });
  }
});

/**
 * GET /api/basketball/debug/date/:date
 * Debug basketball fixtures for a specific date
 */
router.get('/debug/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`🔍 [BasketballRoutes] DEBUG: Fetching fixtures for date: ${date}`);

    const fixtures = await basketballApiService.getFixturesByDate(date);

    res.json({
      date,
      fixturesCount: fixtures.length,
      fixtures: fixtures.slice(0, 5), // Show first 5 fixtures
      sampleFixture: fixtures[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching basketball fixtures for debug:', error);
    res.status(500).json({ error: 'Failed to fetch basketball fixtures for debug' });
  }
});

/**
 * GET /api/basketball/debug/leagues
 * Debug route to check what leagues are available
 */
router.get('/debug/leagues', async (req, res) => {
  try {
    console.log(`🔍 [BasketballRoutes] Debug: Fetching all leagues`);

    const leagues = await basketballApiService.getAllLeagues();

    res.json({ 
      success: true,
      count: leagues.length,
      leagues: leagues.slice(0, 20), // First 20 leagues
      apiKey: '81bc62b91b1190622beda24ee23fbd1a'.substring(0, 8) + '...',
      endpoint: 'v1.basketball.api-sports.io'
    });
  } catch (error) {
    console.error('Error in debug leagues:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/basketball/debug/games
 * Debug route to check games for a specific date
 */
router.get('/debug/games', async (req, res) => {
  try {
    const { date = '2025-01-26' } = req.query;
    console.log(`🔍 [BasketballRoutes] Debug: Fetching games for date ${date}`);

    const games = await basketballApiService.getFixturesByDate(date as string);

    res.json({ 
      success: true,
      date: date,
      count: games.length,
      games: games.slice(0, 10), // First 10 games
      apiKey: '81bc62b91b1190622beda24ee23fbd1a'.substring(0, 8) + '...',
      endpoint: 'v1.basketball.api-sports.io'
    });
  } catch (error) {
    console.error('Error in debug games:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/basketball/debug/raw/:leagueId
 * Debug route to check raw API response for a specific league
 */
router.get('/debug/raw/:leagueId', async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId);
    console.log(`🔍 [BasketballRoutes] Debug: Raw API test for league ${leagueId}`);

    // Test multiple endpoints
    const testEndpoints = [
      `/games?league=${leagueId}`,
      `/games?league=${leagueId}&season=2024`,
      `/games?league=${leagueId}&season=2024-2025`,
      `/games?date=2025-01-26`,
      `/leagues/${leagueId}`
    ];

    const results = [];
    for (const endpoint of testEndpoints) {
      try {
        const response = await basketballApiService.makeRequest(endpoint);
        results.push({
          endpoint,
          success: response.success,
          dataCount: response.data?.response?.length || 0,
          data: response.data
        });
      } catch (error) {
        results.push({
          endpoint,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      leagueId,
      testResults: results,
      apiKey: '81bc62b91b1190622beda24ee23fbd1a'.substring(0, 8) + '...',
      endpoint: 'v1.basketball.api-sports.io'
    });
  } catch (error) {
    console.error('Error in debug raw:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;