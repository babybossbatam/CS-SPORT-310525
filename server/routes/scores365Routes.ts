
import express from 'express';
import { scores365API } from '../services/scores365Api.js';

const router = express.Router();

// Get game stats from 365scores
router.get('/game/:gameId/stats', async (req, res) => {
  const { gameId } = req.params;
  const { timezone = 'Asia/Manila' } = req.query;

  try {
    console.log(`📊 [365Scores API] Fetching stats for game ${gameId}`);
    
    const gameStats = await scores365API.getGameStats(
      parseInt(gameId), 
      timezone as string
    );

    if (gameStats) {
      res.json(gameStats);
    } else {
      res.status(404).json({ error: 'Game stats not found' });
    }
  } catch (error) {
    console.error(`❌ [365Scores API] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

// Get player stats from specific game
router.get('/game/:gameId/player/:playerId/stats', async (req, res) => {
  const { gameId, playerId } = req.params;
  const { timezone = 'Asia/Manila' } = req.query;

  try {
    console.log(`📊 [365Scores API] Fetching player ${playerId} stats from game ${gameId}`);
    
    const playerStats = await scores365API.getPlayerStats(
      parseInt(gameId),
      parseInt(playerId), 
      timezone as string
    );

    if (playerStats) {
      res.json(playerStats);
    } else {
      res.status(404).json({ error: 'Player stats not found' });
    }
  } catch (error) {
    console.error(`❌ [365Scores API] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get live game stats
router.get('/game/:gameId/live-stats', async (req, res) => {
  const { gameId } = req.params;
  const { timezone = 'Asia/Manila' } = req.query;

  try {
    console.log(`🔴 [365Scores API] Fetching live stats for game ${gameId}`);
    
    const liveStats = await scores365API.getLiveGameStats(
      parseInt(gameId), 
      timezone as string
    );

    if (liveStats) {
      res.json(liveStats);
    } else {
      res.status(404).json({ error: 'Live stats not found' });
    }
  } catch (error) {
    console.error(`❌ [365Scores API] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch live stats' });
  }
});

export default router;
