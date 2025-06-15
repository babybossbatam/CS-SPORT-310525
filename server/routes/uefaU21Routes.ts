
import { Router } from 'express';
import { uefaU21ApiService } from '../services/uefaU21Api';

const router = Router();

// Get UEFA U21 fixtures for a specific date
router.get('/fixtures/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`🎯 [UEFA U21 Routes] Fetching fixtures for date: ${date}`);
    
    const fixtures = await uefaU21ApiService.getU21FixturesForDate(date);
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching fixtures by date:', error);
    res.status(500).json({ error: 'Failed to fetch UEFA U21 fixtures' });
  }
});

// Get UEFA U21 fixtures for a date range
router.get('/fixtures/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    console.log(`🎯 [UEFA U21 Routes] Fetching fixtures from ${startDate} to ${endDate}`);
    
    const fixtures = await uefaU21ApiService.getU21FixturesForDateRange(startDate, endDate);
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching fixtures by range:', error);
    res.status(500).json({ error: 'Failed to fetch UEFA U21 fixtures for range' });
  }
});

// Get upcoming UEFA U21 matches (next 7 days)
router.get('/upcoming', async (req, res) => {
  try {
    console.log(`🎯 [UEFA U21 Routes] Fetching upcoming U21 matches`);
    
    const fixtures = await uefaU21ApiService.getUpcomingU21Matches();
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching upcoming matches:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming UEFA U21 matches' });
  }
});

// Get recent UEFA U21 matches (past 7 days)
router.get('/recent', async (req, res) => {
  try {
    console.log(`🎯 [UEFA U21 Routes] Fetching recent U21 matches`);
    
    const fixtures = await uefaU21ApiService.getRecentU21Matches();
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching recent matches:', error);
    res.status(500).json({ error: 'Failed to fetch recent UEFA U21 matches' });
  }
});

// Get current season UEFA U21 fixtures
router.get('/season/current', async (req, res) => {
  try {
    console.log(`🎯 [UEFA U21 Routes] Fetching current season fixtures`);
    
    const fixtures = await uefaU21ApiService.getCurrentSeasonU21Fixtures();
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching current season:', error);
    res.status(500).json({ error: 'Failed to fetch current season UEFA U21 fixtures' });
  }
});

// Get sample UEFA U21 matches
router.get('/sample', async (req, res) => {
  try {
    console.log(`🎯 [UEFA U21 Routes] Fetching sample U21 matches`);
    
    const fixtures = await uefaU21ApiService.getSampleU21Matches();
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching sample matches:', error);
    res.status(500).json({ error: 'Failed to fetch sample UEFA U21 matches' });
  }
});

// Get live UEFA U21 matches
router.get('/live', async (req, res) => {
  try {
    console.log(`🎯 [UEFA U21 Routes] Fetching live U21 matches`);
    
    const fixtures = await uefaU21ApiService.getLiveU21Matches();
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error fetching live matches:', error);
    res.status(500).json({ error: 'Failed to fetch live UEFA U21 matches' });
  }
});

// Search for specific matches by team names
router.get('/search/:homeTeam/:awayTeam', async (req, res) => {
  try {
    const { homeTeam, awayTeam } = req.params;
    console.log(`🎯 [UEFA U21 Routes] Searching for: ${homeTeam} vs ${awayTeam}`);
    
    const fixtures = await uefaU21ApiService.searchU21MatchesByTeams(homeTeam, awayTeam);
    
    res.json(fixtures);
  } catch (error) {
    console.error('❌ [UEFA U21 Routes] Error searching matches:', error);
    res.status(500).json({ error: 'Failed to search UEFA U21 matches' });
  }
});

export default router;
