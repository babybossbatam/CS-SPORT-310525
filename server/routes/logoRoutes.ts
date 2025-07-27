
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
    
    // Create a promise-based HTTP request
    const logoData = await new Promise<Buffer>((resolve, reject) => {
      const request = https.get(apiSportsUrl, {
        timeout: 10000, // 10 second timeout
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
    
    // Set appropriate headers and send the image
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Content-Length': logoData.length
    });
    
    res.send(logoData);
    console.log(`✅ [Logo Proxy] Successfully proxied league logo for ID: ${leagueId}`);
    
  } catch (error) {
    console.error(`❌ [Logo Proxy] Failed to fetch league logo for ID: ${leagueId}:`, error);
    
    // Send fallback logo
    res.redirect('/assets/fallback-logo.svg');
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
