
import express from 'express';

const router = express.Router();

// Dailymotion public API (no key required for basic search)
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const apiUrl = `https://www.dailymotion.com/api/videos?search=${encodeURIComponent(q as string)}&limit=${maxResults}&fields=id,title,description,thumbnail_240_url,created_time,owner,duration`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Dailymotion API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to match our interface
    const transformedData = {
      items: data.list || []
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Dailymotion proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Dailymotion data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
