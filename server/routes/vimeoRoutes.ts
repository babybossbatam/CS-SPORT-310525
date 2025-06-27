
import express from 'express';

const router = express.Router();

// Vimeo doesn't require API key for public video search
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use Vimeo's public API endpoint
    const apiUrl = `https://vimeo.com/api/v2/search/${encodeURIComponent(q as string)}.json`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Vimeo API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to match our interface
    const transformedData = {
      items: Array.isArray(data) ? data.slice(0, Number(maxResults)).map((video: any) => ({
        id: video.url.split('/').pop(),
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnail_medium,
        created_time: video.upload_date,
        user_name: video.user_name,
        duration: video.duration,
        url: video.url
      })) : []
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Vimeo proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Vimeo data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
