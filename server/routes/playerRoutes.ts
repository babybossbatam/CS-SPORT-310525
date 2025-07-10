import express from 'express';

const router = express.Router();

// Player photo endpoint with multiple CDN fallbacks
router.get('/player-photo/:playerId', async (req, res) => {
  const { playerId } = req.params;

  if (!playerId || isNaN(Number(playerId))) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  const cdnSources = [
    // 365Scores CDN (primary)
    `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
    // API-Sports CDN
    `https://media.api-sports.io/football/players/${playerId}.png`,
    // BeSoccer CDN
    `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
    // SportMonks CDN
    `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
  ];

  console.log(`🔍 [PlayerPhoto] Trying to fetch photo for player ${playerId}`);

  for (const url of cdnSources) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000,
      });

      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        console.log(`✅ [PlayerPhoto] Found image for player ${playerId} at: ${url}`);
        return res.redirect(url);
      }
    } catch (error) {
      console.log(`⚠️ [PlayerPhoto] Failed to fetch from ${url}:`, error.message);
    }
  }

  // If no image found, return a 404
  console.log(`❌ [PlayerPhoto] No image found for player ${playerId}`);
  res.status(404).json({ error: 'Player photo not found' });
});

export default router;