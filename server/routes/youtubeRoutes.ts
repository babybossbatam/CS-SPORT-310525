
import express from 'express';

const router = express.Router();

// Store API key securely on server
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

router.get('/search', async (req, res) => {
  try {
    const { q, channelId, maxResults = 10, order = 'relevance', eventType } = req.query;
    
    // Check if API key is available
    if (!YOUTUBE_API_KEY) {
      return res.status(403).json({ 
        error: 'YouTube API key not configured. Please add YOUTUBE_API_KEY to environment variables.',
        quotaExceeded: false,
        fallbackSuggestion: 'Configure API key in Secrets'
      });
    }
    
    let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&key=${YOUTUBE_API_KEY}`;
    
    if (q) apiUrl += `&q=${encodeURIComponent(q as string)}`;
    if (channelId) apiUrl += `&channelId=${channelId}`;
    if (maxResults) apiUrl += `&maxResults=${maxResults}`;
    if (order) apiUrl += `&order=${order}`;
    if (eventType) apiUrl += `&eventType=${eventType}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API Error:', data.error);
      
      // Handle specific quota errors
      if (data.error.code === 403 || data.error.message.includes('quota')) {
        return res.status(403).json({ 
          error: 'YouTube API quota exceeded. Quota resets daily at midnight PST.',
          quotaExceeded: true,
          resetTime: 'Daily at midnight PST',
          fallbackSuggestion: 'Search manually on YouTube or try again tomorrow'
        });
      }
      
      return res.status(response.status).json({ 
        error: data.error.message,
        quotaExceeded: false
      });
    }

    res.json(data);
  } catch (error) {
    console.error('YouTube proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch YouTube data',
      quotaExceeded: false 
    });
  }
});

export default router;
