
import express from 'express';

const router = express.Router();

// Dailymotion public API (no key required for basic search)
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q as string;
    const maxRes = Number(maxResults);
    
    // Try multiple Dailymotion search approaches
    const searchMethods = [
      // Method 1: Updated API endpoint
      async () => {
        const apiUrl = `https://www.dailymotion.com/player/metadata/video/search?query=${encodeURIComponent(query)}&limit=${maxRes}`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.dailymotion.com/'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Dailymotion API failed: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('Dailymotion returned non-JSON response');
        }
        
        const data = await response.json();
        return { list: data.videos || [] };
      },
      
      // Method 2: Try with GraphQL-like API
      async () => {
        const simplifiedQuery = query.replace(/[^\w\s]/g, ' ').trim();
        const apiUrl = `https://graphql.api.dailymotion.com/`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': 'https://www.dailymotion.com/'
          },
          body: JSON.stringify({
            query: `query { videos(search: "${simplifiedQuery.replace(/"/g, '\\"')}", first: ${maxRes}) { edges { node { id title description thumbnailURL createdAt owner { displayName } duration } } } }`
          })
        });
        
        if (!response.ok) {
          throw new Error(`Dailymotion GraphQL failed: ${response.status}`);
        }
        
        const data = await response.json();
        const videos = data.data?.videos?.edges?.map((edge: any) => edge.node) || [];
        return { list: videos };
      }
    ];

    let data = null;
    let lastError = null;

    // Try each search method
    for (const searchMethod of searchMethods) {
      try {
        data = await searchMethod();
        if (data && data.list && Array.isArray(data.list) && data.list.length > 0) {
          break; // Success, stop trying other methods
        }
      } catch (error) {
        lastError = error;
        console.warn('Dailymotion search method failed:', error);
        continue;
      }
    }

    // If no data found, return empty results instead of error
    if (!data || !data.list || !Array.isArray(data.list)) {
      console.log(`No Dailymotion results found for query: ${query}`);
      return res.json({ items: [] });
    }
    
    // Transform and clean data
    const transformedData = {
      items: data.list.map((video: any) => ({
        id: video.id || 'unknown',
        title: video.title || 'Untitled Video',
        description: video.description || '',
        thumbnail_240_url: video.thumbnail_240_url || '',
        created_time: video.created_time || new Date().toISOString(),
        owner: video.owner || 'Unknown User',
        duration: video.duration || 0
      })).filter((video: any) => video.title !== 'Untitled Video' && video.id !== 'unknown')
    };

    console.log(`Found ${transformedData.items.length} Dailymotion results for: ${query}`);
    res.json(transformedData);
    
  } catch (error) {
    console.error('Dailymotion proxy error:', error);
    // Return empty results instead of error to prevent cascade failures
    res.json({ 
      items: [],
      warning: 'Dailymotion search temporarily unavailable'
    });
  }
});

export { router as dailymotionRoutes };
