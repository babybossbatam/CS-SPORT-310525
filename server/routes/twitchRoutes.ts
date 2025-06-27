
import express from 'express';

const router = express.Router();

// Twitch doesn't have a public API for video search without authentication
// But we can try to search for clips/highlights using their public endpoints
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q as string;
    
    // Note: Twitch requires API key for most endpoints
    // This is a fallback that searches for publicly available clips
    // For production, you'd want to register a Twitch app and get API credentials
    
    console.log(`Twitch search requested for: ${query}`);
    
    // For now, return empty results since Twitch requires authentication
    // You can extend this by adding Twitch API credentials to your environment
    res.json({ 
      items: [],
      message: 'Twitch search requires API credentials. Add TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET to enable Twitch integration.'
    });
    
  } catch (error) {
    console.error('Twitch proxy error:', error);
    res.json({ 
      items: [],
      warning: 'Twitch search temporarily unavailable'
    });
  }
});

export default router;
