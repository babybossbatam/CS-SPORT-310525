import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

// League logo proxy endpoint
router.get('/league-logo/:leagueId', async (req, res) => {
  const { leagueId } = req.params;

  try {
    console.log(`🔍 [Logo Proxy] Fetching league logo for ID: ${leagueId}`);

    // Try API-Sports media URL
    const apiSportsUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
    console.log(`📡 [Logo Proxy] Attempting to fetch from: ${apiSportsUrl}`);

    // Create a promise-based HTTP request
    const logoData = await new Promise<Buffer>((resolve, reject) => {
      const request = https.get(apiSportsUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'CS-Sport-App/1.0',
          'Accept': 'image/png,image/jpeg,image/*,*/*'
        }
      }, (response) => {
        console.log(`📊 [Logo Proxy] Response status: ${response.statusCode} for league ${leagueId}`);

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`📦 [Logo Proxy] Received ${buffer.length} bytes for league ${leagueId}`);
          resolve(buffer);
        });
      });

      request.on('error', (error) => {
        console.error(`🌐 [Logo Proxy] Network error for league ${leagueId}:`, error.message);
        reject(error);
      });

      request.on('timeout', () => {
        console.warn(`⏰ [Logo Proxy] Timeout for league ${leagueId}`);
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Set appropriate headers and send the image
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Content-Length': logoData.length,
      'Access-Control-Allow-Origin': '*'
    });

    res.send(logoData);
    console.log(`✅ [Logo Proxy] Successfully proxied league logo for ID: ${leagueId} (${logoData.length} bytes)`);

  } catch (error) {
    console.error(`❌ [Logo Proxy] Failed to fetch league logo for ID: ${leagueId}:`, error?.message || 'Unknown error');

    // Try alternative API-Sports URL format
    try {
      console.log(`🔄 [Logo Proxy] Trying alternative format for league ${leagueId}`);
      const altApiUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;

      const altLogoData = await new Promise<Buffer>((resolve, reject) => {
        const request = https.get(altApiUrl, {
          timeout: 5000,
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
        'Content-Length': altLogoData.length
      });

      res.send(altLogoData);
      console.log(`✅ [Logo Proxy] Successfully used alternative URL for league ${leagueId}`);

    } catch (altError) {
      console.error(`❌ [Logo Proxy] Alternative URL also failed for league ${leagueId}:`, altError?.message);

      // Final fallback
      try {
        const fallbackPath = '/assets/fallback-logo.svg';
        console.log(`🔄 [Logo Proxy] Sending fallback for league ${leagueId}: ${fallbackPath}`);
        res.redirect(302, fallbackPath);
      } catch (fallbackError) {
        console.error(`💥 [Logo Proxy] Even fallback failed for league ${leagueId}:`, fallbackError);
        res.status(404).send('Logo not found');
      }
    }
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

export default router;