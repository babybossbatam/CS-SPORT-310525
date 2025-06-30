
import express from 'express';

const router = express.Router();

// Player photo endpoint
router.get('/player-photo/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Try multiple sources for player photos
    const photoSources = [
      `https://media.api-sports.io/football/players/${playerId}.png`,
      `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
      `https://img.a.transfermarkt.technology/portrait/big/${playerId}.jpg`,
    ];

    // Try to fetch from the first source
    const response = await fetch(photoSources[0]);
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      res.set({
        'Content-Type': response.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.send(Buffer.from(buffer));
    }

    // If first source fails, return a 404 to trigger client-side fallback
    res.status(404).json({ error: 'Player photo not found' });
    
  } catch (error) {
    console.error(`❌ [Player Photo] Error fetching photo for player ${req.params.playerId}:`, error);
    res.status(404).json({ error: 'Player photo not found' });
  }
});

export default router;
