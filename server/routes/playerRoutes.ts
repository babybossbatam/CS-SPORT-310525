
import express from 'express';

const router = express.Router();

// Player photo endpoint
router.get('/player-photo/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Try multiple sources for player photos
    const photoSources = [
      `https://media.api-sports.io/football/players/${playerId}.png`,
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:${playerId}.png,r_max,c_thumb,g_face,z_0.65/v16/Athletes/NationalTeam/${playerId}`,
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:${playerId}.png/v16/Athletes/${playerId}`,
      `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
      `https://img.a.transfermarkt.technology/portrait/big/${playerId}.jpg`,
      `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${playerId}`,
    ];

    // Try each source until one works
    for (const photoUrl of photoSources) {
      try {
        console.log(`🔍 [Player Photo] Trying source: ${photoUrl}`);
        const response = await fetch(photoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 5000,
        });
        
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          const buffer = await response.arrayBuffer();
          
          // Verify we actually got image data, not an error page
          if (buffer.byteLength > 100) { // Minimum size check
            console.log(`✅ [Player Photo] Success from: ${photoUrl}`);
            res.set({
              'Content-Type': response.headers.get('content-type') || 'image/png',
              'Cache-Control': 'public, max-age=3600',
            });
            return res.send(Buffer.from(buffer));
          }
        }
        console.log(`❌ [Player Photo] Failed from: ${photoUrl} (status: ${response.status})`);
      } catch (error) {
        console.warn(`❌ [Player Photo] Error from ${photoUrl}:`, error.message);
        continue;
      }
    }

    // If all sources fail, return a proper 404
    console.log(`❌ [Player Photo] All sources failed for player ${playerId}`);
    res.status(404).json({ error: 'Player photo not found' });
    
  } catch (error) {
    console.error(`❌ [Player Photo] Error fetching photo for player ${req.params.playerId}:`, error);
    res.status(404).json({ error: 'Player photo not found' });
  }
});

export default router;
