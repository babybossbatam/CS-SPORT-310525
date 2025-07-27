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

    // Create a promise-based HTTP request with shorter timeout
    const logoData = await new Promise<Buffer>((resolve, reject) => {
      const request = https.get(apiSportsUrl, {
        timeout: 5000, // Reduced to 5 second timeout
        headers: {
          'User-Agent': 'CS-Sport-App/1.0',
          'Accept': 'image/png,image/jpeg,image/*,*/*',
          'Connection': 'close' // Ensure connection closes
        }
      }, (response) => {
        console.log(`📊 [Logo Proxy] Response status: ${response.statusCode} for league ${leagueId}`);

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const chunks: Buffer[] = [];
        let totalSize = 0;
        const maxSize = 1024 * 1024; // 1MB limit

        response.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > maxSize) {
            reject(new Error('Response too large'));
            return;
          }
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`📦 [Logo Proxy] Received ${buffer.length} bytes for league ${leagueId}`);
          resolve(buffer);
        });

        response.on('error', (error) => {
          reject(error);
        });
      });

      request.on('error', (error) => {
        console.error(`🌐 [Logo Proxy] Network error for league ${leagueId}:`, error?.message);
        reject(error);
      });

      request.on('timeout', () => {
        console.warn(`⏰ [Logo Proxy] Timeout for league ${leagueId}`);
        request.destroy();
        reject(new Error('Request timeout'));
      });

      // Set absolute timeout
      setTimeout(() => {
        if (!request.destroyed) {
          console.warn(`🕐 [Logo Proxy] Absolute timeout for league ${leagueId}`);
          request.destroy();
          reject(new Error('Absolute timeout'));
        }
      }, 6000); // 6 seconds absolute timeout
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

    // Instead of redirect, send the fallback image directly
    try {
      const fallbackPath = '/assets/fallback-logo.svg';
      console.log(`🔄 [Logo Proxy] Sending fallback for league ${leagueId}: ${fallbackPath}`);
      res.redirect(302, fallbackPath);
    } catch (fallbackError) {
      console.error(`💥 [Logo Proxy] Even fallback failed for league ${leagueId}:`, fallbackError);
      res.status(404).send('Logo not found');
    }
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