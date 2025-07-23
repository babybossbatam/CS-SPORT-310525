import express from 'express';

const router = express.Router();

// Store API key securely on server
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Simple in-memory quota tracking (resets on server restart)
let dailyQuotaUsed = 0;
const DAILY_QUOTA_LIMIT = 8000; // Leave buffer before hitting 10k limit
const QUOTA_RESET_TIME = new Date();
QUOTA_RESET_TIME.setHours(24, 0, 0, 0); // Reset at midnight PST (approximate)

router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10, order = 'relevance', eventType } = req.query;

    // Check if API key is available
    if (!YOUTUBE_API_KEY) {
      return res.status(403).json({ 
        error: 'YouTube API key not configured. Please add YOUTUBE_API_KEY to environment variables.',
        quotaExceeded: false,
        fallbackSuggestion: 'Configure API key in Secrets'
      });
    }

    // Check quota before making request
    const now = new Date();
    if (now > QUOTA_RESET_TIME) {
      dailyQuotaUsed = 0; // Reset quota tracking
      QUOTA_RESET_TIME.setDate(QUOTA_RESET_TIME.getDate() + 1);
    }

    if (dailyQuotaUsed >= DAILY_QUOTA_LIMIT) {
      return res.status(429).json({
        error: 'YouTube API quota limit reached for today. Using alternative video sources.',
        quotaExceeded: true,
        resetTime: 'Daily at midnight PST',
        quotaUsed: dailyQuotaUsed,
        quotaLimit: DAILY_QUOTA_LIMIT,
        fallbackSuggestion: 'Try Vimeo or Dailymotion alternatives'
      });
    }

    let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&key=${YOUTUBE_API_KEY}`;

    if (q) apiUrl += `&q=${encodeURIComponent(q as string)}`;
    if (req.query.channelId) apiUrl += `&channelId=${req.query.channelId}`;
    if (maxResults) apiUrl += `&maxResults=${maxResults}`;
    if (order) apiUrl += `&order=${order}`;
    if (eventType) apiUrl += `&eventType=${eventType}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API Error:', data.error);

      // Handle specific quota errors
      if (data.error.code === 403 || data.error.message.includes('quota') || data.error.code === 429) {
        dailyQuotaUsed = DAILY_QUOTA_LIMIT; // Mark as quota exceeded
        console.warn(`🚫 YouTube quota exceeded. Used: ${dailyQuotaUsed}/${DAILY_QUOTA_LIMIT}`);
        return res.status(429).json({ 
          error: 'YouTube API quota exceeded. Using alternative video sources.',
          quotaExceeded: true,
          resetTime: 'Daily at midnight PST',
          quotaUsed: dailyQuotaUsed,
          quotaLimit: DAILY_QUOTA_LIMIT,
          fallbackSuggestion: 'Switching to Vimeo, Dailymotion, or ScoreBat'
        });
      }

      return res.status(response.status).json({ 
        error: data.error.message,
        quotaExceeded: false
      });
    }

    // Track successful API usage (each search costs ~100 quota units)
    dailyQuotaUsed += 100;

    console.log(`📊 YouTube quota usage: ${dailyQuotaUsed}/${DAILY_QUOTA_LIMIT} units`);

    res.json(data);
  } catch (error) {
    console.error('YouTube proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch YouTube data',
      quotaExceeded: false 
    });
  }
});

export { router as youtubeRoutes };