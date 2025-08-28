import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

// League logo proxy endpoint
router.get('/league-logo/:leagueId', async (req, res) => {
  const { leagueId } = req.params;

  try {
    console.log(`🔍 [Logo Proxy] Fetching league logo for ID: ${leagueId}`);

    // Try multiple API-Sports URLs for better success rate
    const logoSources = [
      `https://media.api-sports.io/football/leagues/${leagueId}.png`,
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitions:default1.png/v12/Competitions/${leagueId}`
    ];

    for (const sourceUrl of logoSources) {
      try {
        console.log(`📡 [Logo Proxy] Attempting to fetch from: ${sourceUrl}`);

        const logoData = await new Promise<Buffer>((resolve, reject) => {
          const request = https.get(sourceUrl, {
            timeout: 8000, // 8 second timeout
            headers: {
              'User-Agent': 'CS-Sport-App/1.0',
              'Accept': 'image/png,image/jpeg,image/*,*/*',
              'Accept-Encoding': 'gzip, deflate, br'
            }
          }, (response) => {
            console.log(`📊 [Logo Proxy] Response status: ${response.statusCode} for league ${leagueId} from ${sourceUrl}`);

            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
              return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              console.log(`📦 [Logo Proxy] Received ${buffer.length} bytes for league ${leagueId} from ${sourceUrl}`);
              resolve(buffer);
            });
          });

          request.on('error', (error) => {
            console.error(`🌐 [Logo Proxy] Network error for league ${leagueId} from ${sourceUrl}:`, error.message);
            reject(error);
          });

          request.on('timeout', () => {
            console.warn(`⏰ [Logo Proxy] Timeout for league ${leagueId} from ${sourceUrl}`);
            request.destroy();
            reject(new Error('Request timeout'));
          });
        });

        // Set appropriate headers and send the image
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Content-Length': logoData.length,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
        });

        res.send(logoData);
        console.log(`✅ [Logo Proxy] Successfully proxied league logo for ID: ${leagueId} (${logoData.length} bytes) from ${sourceUrl}`);
        return; // Exit the function on success

      } catch (sourceError) {
        console.error(`❌ [Logo Proxy] Failed to fetch from ${sourceUrl} for league ${leagueId}:`, sourceError?.message);
        continue; // Try next source
      }
    }

    // If all sources fail, redirect to fallback
    console.log(`🔄 [Logo Proxy] All sources failed for league ${leagueId}, using fallback`);
    res.redirect(302, '/assets/fallback-logo.svg');

  } catch (error) {
    console.error(`❌ [Logo Proxy] Unexpected error for league ${leagueId}:`, error?.message || 'Unknown error');
    res.status(404).json({ error: 'League logo not found' });
  }
});

// Get league logo with square format
router.get('/league-logo/square/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;

    console.log(`🔲 [logoRoutes] Square league logo requested for ID: ${leagueId}`);

    // Set proper headers for image response
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'Access-Control-Allow-Origin': '*'
    });

    // For now, redirect to regular league logo
    // In the future, this could return a square version
    const logoUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;

    // Fetch the image and pipe it through
    const response = await fetch(logoUrl);
    if (response.ok) {
      response.body?.pipe(res);
    } else {
      console.warn(`⚠️ [logoRoutes] Failed to fetch square logo for league ${leagueId}`);
      res.redirect(`/api/league-logo/${leagueId}`);
    }
  } catch (error) {
    console.error('Error fetching square league logo:', error);
    // Fallback to regular league logo endpoint
    res.redirect(`/api/league-logo/${req.params.leagueId}`);
  }
});

// Team logo proxy endpoint
router.get('/team-logo/:teamId', async (req, res) => {
  const { teamId } = req.params;

  try {
    console.log(`🔍 [Logo Proxy] Fetching team logo for ID: ${teamId}`);

    const apiSportsUrl = `https://media.api-sports.io/football/teams/${teamId}.png`;

    const logoData = await new Promise<Buffer>((resolve, reject) => {
      const request = https.get(apiSportsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CS-Sport-App/1.0',
          'Accept': 'image/png,image/jpeg,image/*,*/*'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': logoData.length
    });

    res.send(logoData);
    console.log(`✅ [Logo Proxy] Successfully proxied team logo for ID: ${teamId}`);

  } catch (error) {
    console.error(`❌ [Logo Proxy] Failed to fetch team logo for ID: ${teamId}:`, error);
    res.redirect('/assets/fallback-logo.svg');
  }
});

// Debug endpoint to test league logo availability
router.get('/debug/league-logo/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  
  const sources = [
    `https://media.api-sports.io/football/leagues/${leagueId}.png`,
    `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitions:default1.png/v12/Competitions/${leagueId}`,
    `/assets/league-logos/${leagueId}.png`
  ];

  const results = [];

  for (const source of sources) {
    try {
      const testResponse = await fetch(source, { method: 'HEAD' });
      results.push({
        source,
        status: testResponse.status,
        available: testResponse.ok
      });
    } catch (error) {
      results.push({
        source,
        status: 'error',
        available: false,
        error: error.message
      });
    }
  }

  res.json({
    leagueId,
    sources: results,
    recommendation: results.find(r => r.available)?.source || 'Use fallback'
  });
});

export default router;