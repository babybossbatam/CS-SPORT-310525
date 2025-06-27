
import express from 'express';

const router = express.Router();

// Store API key securely on server
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyA_hEdy01ChpBkp3MWKBmda6DsDDbcCw-o';

router.get('/search', async (req, res) => {
  try {
    const { q, channelId, maxResults = 10, order = 'relevance', eventType } = req.query;
    
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
      return res.status(response.status).json({ 
        error: data.error.message,
        quotaExceeded: data.error.message.includes('quota') || response.status === 403
      });
    }

    res.json(data);
  } catch (error) {
    console.error('YouTube proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube data' });
  }
});

export default router;
