
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get Twitch OAuth token
async function getTwitchAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Twitch credentials not configured');
  }

  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Twitch access token:', error);
    throw error;
  }
}

// Search for Twitch clips
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q as string;
    const clientId = process.env.TWITCH_CLIENT_ID;
    
    if (!clientId) {
      return res.json({ 
        items: [],
        message: 'Twitch credentials not configured. Add TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET to Replit Secrets.'
      });
    }

    console.log(`Twitch search requested for: ${query}`);
    
    // Get access token
    const accessToken = await getTwitchAccessToken();
    
    // Search for clips using Twitch API
    const response = await axios.get('https://api.twitch.tv/helix/clips', {
      params: {
        game_id: '518203', // Football/Soccer game ID on Twitch
        first: Math.min(parseInt(maxResults as string), 20)
      },
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const clips = response.data.data || [];
    
    // Transform Twitch clips to match our expected format
    const items = clips.map((clip: any) => ({
      id: clip.id,
      title: clip.title,
      description: clip.title,
      thumbnail: clip.thumbnail_url,
      broadcaster_name: clip.broadcaster_name,
      created_at: clip.created_at,
      url: clip.url,
      duration: clip.duration,
      view_count: clip.view_count
    }));

    res.json({ items });
    
  } catch (error) {
    console.error('Twitch proxy error:', error);
    res.json({ 
      items: [],
      warning: 'Twitch search temporarily unavailable'
    });
  }
});

export default router;
