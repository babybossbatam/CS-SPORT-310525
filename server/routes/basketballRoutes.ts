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
    
    if (isWorking) {
      res.json({ 
        success: true, 
        message: 'Basketball API connection successful',
        endpoint: 'v1.basketball.api-sports.io'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Basketball API connection failed',
        endpoint: 'v1.basketball.api-sports.io'
      });
    }
  } catch (error) {
    console.error('Error testing basketball API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test basketball API connection' 
    });
  }
});

export default router;