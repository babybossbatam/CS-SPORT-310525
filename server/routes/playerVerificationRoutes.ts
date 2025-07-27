
import express from 'express';
import PlayerIdMapper from '../utils/playerIdMapper';

const router = express.Router();

// Verify if player ID exists in our mapping
router.post('/players/verify', async (req, res) => {
  const { playerId } = req.body;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    const mapping = PlayerIdMapper.getPlayerMapping(Number(playerId));
    const isVerified = PlayerIdMapper.isVerified(Number(playerId));

    res.json({
      verified: isVerified,
      mapping: mapping,
      playerId: Number(playerId)
    });

  } catch (error) {
    console.error(`❌ [PlayerVerification] Error verifying player ${playerId}:`, error);
    res.status(500).json({ error: 'Failed to verify player ID' });
  }
});

// Import verified players from dashboard export
router.post('/players/import-verified', async (req, res) => {
  const { csvData } = req.body;

  if (!csvData) {
    return res.status(400).json({ error: 'CSV data is required' });
  }

  try {
    PlayerIdMapper.loadFromDashboardExport(csvData);
    const stats = PlayerIdMapper.getCacheStats();
    
    res.json({
      success: true,
      imported: true,
      stats: stats
    });

  } catch (error) {
    console.error(`❌ [PlayerVerification] Error importing verified players:`, error);
    res.status(500).json({ error: 'Failed to import verified players' });
  }
});

// Get cache statistics
router.get('/players/cache-stats', (req, res) => {
  try {
    const stats = PlayerIdMapper.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error(`❌ [PlayerVerification] Error getting cache stats:`, error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

export default router;
