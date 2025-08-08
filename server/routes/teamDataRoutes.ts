
import express from 'express';

const router = express.Router();

// Simple in-memory cache for team data
const teamDataCache = new Map<string, any>();

router.get('/teams/:teamId', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    // Check cache first
    const cached = teamDataCache.get(teamId);
    if (cached) {
      return res.json(cached);
    }

    // Here you would fetch from your data source
    // For now, return a basic structure
    const teamData = {
      id: teamId,
      name: '', // You can populate this from your API
      translations: {
        // Add translations based on your team mapping data
      }
    };

    // Cache the result
    teamDataCache.set(teamId, teamData);
    
    res.json(teamData);
  } catch (error) {
    console.error('Error fetching team data:', error);
    res.status(500).json({ error: 'Failed to fetch team data' });
  }
});

export default router;
