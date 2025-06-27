
import express from 'express';

const router = express.Router();

// Vimeo doesn't require API key for public video search
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const query = q as string;
    const maxRes = Number(maxResults);
    
    // Try multiple Vimeo search methods
    const searchMethods = [
      // Method 1: Original Vimeo API v2
      async () => {
        const apiUrl = `https://vimeo.com/api/v2/search/${encodeURIComponent(query)}.json`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoSearchBot/1.0)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Vimeo API v2 failed: ${response.status}`);
        }
        
        return await response.json();
      },
      
      // Method 2: Try a simplified search format
      async () => {
        const simplifiedQuery = query.replace(/[^\w\s]/g, ' ').trim();
        const apiUrl = `https://vimeo.com/api/v2/search/${encodeURIComponent(simplifiedQuery)}.json`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoSearchBot/1.0)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Vimeo simplified search failed: ${response.status}`);
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
        if (data && Array.isArray(data) && data.length > 0) {
          break; // Success, stop trying other methods
        }
      } catch (error) {
        lastError = error;
        console.warn('Vimeo search method failed:', error);
        continue;
      }
    }

    // If no data found, return empty results instead of error
    if (!data || !Array.isArray(data)) {
      console.log(`No Vimeo results found for query: ${query}`);
      return res.json({ items: [] });
    }
    
    // Transform to match our interface
    const transformedData = {
      items: data.slice(0, maxRes).map((video: any) => ({
        id: video.url?.split('/').pop() || video.id || 'unknown',
        title: video.title || 'Untitled Video',
        description: video.description || '',
        thumbnail: video.thumbnail_medium || video.thumbnail_large || '',
        created_time: video.upload_date || new Date().toISOString(),
        user_name: video.user_name || 'Unknown User',
        duration: video.duration || 0,
        url: video.url || `https://vimeo.com/${video.id}`
      })).filter(video => video.title !== 'Untitled Video') // Filter out invalid entries
    };

    console.log(`Found ${transformedData.items.length} Vimeo results for: ${query}`);
    res.json(transformedData);
    
  } catch (error) {
    console.error('Vimeo proxy error:', error);
    // Return empty results instead of error to prevent cascade failures
    res.json({ 
      items: [],
      warning: 'Vimeo search temporarily unavailable'
    });
  }
});

export default router;
