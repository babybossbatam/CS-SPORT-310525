
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Search for match highlights
router.get('/search', async (req, res) => {
  try {
    const { home, away, league } = req.query;
    
    if (!home || !away) {
      return res.status(400).json({ error: 'Home and away team names are required' });
    }

    console.log(`🎬 [HighlightsAPI] Searching highlights for: ${home} vs ${away} (${league || 'No league'})`);

    // Create search query
    const searchQuery = `${home} vs ${away} highlights ${league || ''}`.trim();
    
    // Try multiple sources for highlights
    const highlightsSources = [
      {
        name: 'ScoreBat',
        url: `https://www.scorebat.com/video-api/v3/feed/?token=MTcwMzIzMzM5MF8xNjk5NjMyNDQwXzllYzJkZGEzOGI4MTk4NjY0MjIzOGY3NmU4YzA2ZDE4OGQ2MjcwZDU%3D`,
        parse: (data: any) => {
          // Look for matching videos in ScoreBat feed
          const matches = data.response?.filter((video: any) => {
            const title = video.title?.toLowerCase() || '';
            const homeTeam = (home as string).toLowerCase();
            const awayTeam = (away as string).toLowerCase();
            return title.includes(homeTeam) && title.includes(awayTeam);
          });
          
          if (matches && matches.length > 0) {
            return {
              videoUrl: matches[0].embed || matches[0].url,
              title: matches[0].title,
              source: 'ScoreBat'
            };
          }
          return null;
        }
      }
    ];

    // Try each source
    for (const source of highlightsSources) {
      try {
        const response = await axios.get(source.url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const result = source.parse(response.data);
        if (result) {
          console.log(`🎬 [HighlightsAPI] Found highlights from ${source.name}:`, result.title);
          return res.json(result);
        }
      } catch (sourceError) {
        console.warn(`🎬 [HighlightsAPI] ${source.name} failed:`, sourceError.message);
        continue;
      }
    }

    // If no highlights found, return fallback ScoreBat embed URL
    const fallbackUrl = `https://www.scorebat.com/embed/g/${encodeURIComponent(searchQuery.replace(/\s+/g, '-').toLowerCase())}/`;
    
    res.json({
      videoUrl: fallbackUrl,
      title: `${home} vs ${away} Highlights`,
      source: 'ScoreBat Embed',
      fallback: true
    });

  } catch (error) {
    console.error('🎬 [HighlightsAPI] Error searching for highlights:', error);
    res.status(500).json({ 
      error: 'Failed to search for highlights',
      fallback: `https://www.scorebat.com/search/?q=${encodeURIComponent((req.query.home as string) + ' vs ' + (req.query.away as string))}`
    });
  }
});

export default router;
