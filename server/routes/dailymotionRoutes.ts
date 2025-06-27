
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
      // Method 1: Original API endpoint
      async () => {
        const apiUrl = `https://www.dailymotion.com/api/videos?search=${encodeURIComponent(query)}&limit=${maxRes}&fields=id,title,description,thumbnail_240_url,created_time,owner,duration`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoSearchBot/1.0)',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Dailymotion API failed: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('Dailymotion returned non-JSON response');
        }
        
        return await response.json();
      },
      
      // Method 2: Try with simplified query
      async () => {
        const simplifiedQuery = query.replace(/[^\w\s]/g, ' ').trim();
        const apiUrl = `https://www.dailymotion.com/api/videos?search=${encodeURIComponent(simplifiedQuery)}&limit=${maxRes}&fields=id,title,description,thumbnail_240_url,created_time,owner`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoSearchBot/1.0)',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Dailymotion simplified search failed: ${response.status}`);
        }
        
        return await response.json();
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

export default router;
