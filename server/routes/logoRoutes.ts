import express from 'express';
import https from 'https';
import http from 'http';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

// Mock/Placeholder for external services and utilities
// In a real application, these would be imported from their respective modules
const logoCache = new Map();
const rapidApiService = {
  getTeamById: async (teamId: number) => {
    console.log(`Mock: Fetching team ${teamId} from RapidAPI`);
    // Simulate API response
    if (teamId === 1001) { // Example club team
      return { team: { logo: 'https://example.com/logos/team1001.png' } };
    } else if (teamId === 2002) { // Example national team that should be handled by flag
      return { team: { logo: null } }; // No club logo found
    }
    return { team: { logo: null } }; // Default no logo
  }
};

const teamLogoUtils = {
  getTeamLogoUrl: async (teamName: string, teamId: number): Promise<string | null> => {
    console.log(`Mock: Fetching logo for ${teamName} (ID: ${teamId}) from utilities`);
    // Simulate utility lookup
    if (teamName.toLowerCase().includes('manchester united')) {
      return 'https://example.com/logos/manutd.png';
    }
    return null;
  }
};

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

// Enhanced team logo endpoint with comprehensive fallback system
router.get('/team-logo/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, fallback, isNationalTeam } = req.query;

    console.log(`🎯 [Logo Routes] Team logo request - ID: ${teamId}, Name: ${teamName}, National: ${isNationalTeam}`);

    if (!teamId || teamId === 'undefined' || teamId === 'null') {
      console.log('❌ [Logo Routes] Invalid team ID provided');
      return res.status(400).json({ error: 'Valid team ID is required' });
    }

    const numericTeamId = parseInt(teamId as string, 10);
    if (isNaN(numericTeamId)) {
      console.log('❌ [Logo Routes] Team ID is not a valid number');
      return res.status(400).json({ error: 'Team ID must be a valid number' });
    }

    // Check cache first
    const cacheKey = `team-logo-${numericTeamId}`;
    const cachedLogo = logoCache.get(cacheKey);

    if (cachedLogo) {
      console.log(`💾 [Logo Routes] Cache hit for team ${numericTeamId}: ${cachedLogo}`);
      return res.json({ logoUrl: cachedLogo, cached: true });
    }

    // For national teams, don't try RapidAPI - go straight to flag
    if (isNationalTeam === 'true' && teamName) {
      console.log(`🏳️ [Logo Routes] National team detected: ${teamName}, using flag`);
      const flagUrl = getCountryFlagUrl(teamName as string);
      logoCache.set(cacheKey, flagUrl);
      return res.json({ logoUrl: flagUrl, source: 'flag', isNationalTeam: true });
    }

    // Try RapidAPI team endpoint for club teams
    let logoUrl = null;
    try {
      console.log(`🔍 [Logo Routes] Fetching club team ${numericTeamId} from RapidAPI`);
      const teamData = await rapidApiService.getTeamById(numericTeamId);

      if (teamData?.team?.logo && teamData.team.logo.includes('http')) {
        logoUrl = teamData.team.logo;
        console.log(`✅ [Logo Routes] Found club team logo: ${logoUrl}`);

        // Cache the successful result
        logoCache.set(cacheKey, logoUrl);
        return res.json({ logoUrl, source: 'rapidapi-club' });
      }
    } catch (error) {
      console.log(`⚠️ [Logo Routes] RapidAPI team fetch failed: ${error.message}`);
    }

    // If RapidAPI fails, try alternative sources based on team name
    if (teamName && typeof teamName === 'string') {
      console.log(`🔄 [Logo Routes] Trying alternative sources for: ${teamName}`);

      // Check if this might be a national team based on name patterns
      const nationalTeamPatterns = [
        /\b(U21|U20|U19|U18|U17)\b/i,
        /\b(National|International)\b/i,
        /^[A-Z][a-z]+$/ // Single word country names
      ];

      const isLikelyNationalTeam = nationalTeamPatterns.some(pattern =>
        pattern.test(teamName as string)
      );

      if (isLikelyNationalTeam) {
        console.log(`🏳️ [Logo Routes] Detected likely national team: ${teamName}`);
        const flagUrl = getCountryFlagUrl(teamName as string);
        logoCache.set(cacheKey, flagUrl);
        return res.json({ logoUrl: flagUrl, source: 'flag-detected', isNationalTeam: true });
      }

      // Try team logo utilities for club teams
      const alternativeLogo = await teamLogoUtils.getTeamLogoUrl(teamName as string, numericTeamId);
      if (alternativeLogo && alternativeLogo.includes('http')) {
        logoUrl = alternativeLogo;
        console.log(`✅ [Logo Routes] Found alternative logo: ${logoUrl}`);
        logoCache.set(cacheKey, logoUrl);
        return res.json({ logoUrl, source: 'alternative' });
      }
    }

    // Final fallback - return a generic logo
    if (fallback !== 'false') {
      const fallbackUrl = '/assets/fallback-logo.png';
      console.log(`🔄 [Logo Routes] Using fallback logo: ${fallbackUrl}`);
      logoCache.set(cacheKey, fallbackUrl);
      return res.json({ logoUrl: fallbackUrl, source: 'fallback' });
    }

    // No logo found
    console.log(`❌ [Logo Routes] No logo found for team ${numericTeamId}`);
    return res.status(404).json({ error: 'Team logo not found' });

  } catch (error) {
    console.error('❌ [Logo Routes] Error in team logo endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Square team logo proxy endpoint
router.get('/team-logo/square/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { size = '64', sport = 'football', teamName } = req.query;

  try {
    console.log(`🔲 [Logo Proxy] Fetching square team logo for ID: ${teamId}, sport: ${sport}${teamName ? ` (${teamName})` : ''}`);

    // Check if this appears to be a national team that shouldn't use this endpoint
    const nationalTeamNames = ['Iraq', 'Pakistan', 'Australia', 'Yemen', 'Singapore', 'Malaysia', 'Lebanon', 'Kuwait', 'Myanmar', 'Uzbekistan', 'Sri Lanka', 'Vietnam', 'Bangladesh'];
    if (teamName && nationalTeamNames.some(country => teamName.toString().includes(country))) {
      console.log(`🌍 [Logo Proxy] Square endpoint detected national team ${teamName}, redirecting to fallback`);
      res.redirect('/assets/fallback-logo.svg');
      return;
    }

    const sportPath = sport === 'basketball' ? 'basketball' : 'football';
    const apiSportsUrl = `https://media.api-sports.io/${sportPath}/teams/${teamId}.png`;

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
      'Content-Length': logoData.length,
      'Access-Control-Allow-Origin': '*'
    });

    res.send(logoData);
    console.log(`✅ [Logo Proxy] Successfully proxied square team logo for ID: ${teamId}`);

  } catch (error) {
    console.error(`❌ [Logo Proxy] Failed to fetch square team logo for ID: ${teamId}:`, error);
    res.redirect('/assets/fallback-logo.svg');
  }
});

// Circular team logo proxy endpoint
router.get('/team-logo/circular/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { size = '32', sport = 'football' } = req.query;

  try {
    console.log(`⭕ [Logo Proxy] Fetching circular team logo for ID: ${teamId}, sport: ${sport}`);

    const sportPath = sport === 'basketball' ? 'basketball' : 'football';
    const apiSportsUrl = `https://media.api-sports.io/${sportPath}/teams/${teamId}.png`;

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
      'Content-Length': logoData.length,
      'Access-Control-Allow-Origin': '*'
    });

    res.send(logoData);
    console.log(`✅ [Logo Proxy] Successfully proxied circular team logo for ID: ${teamId}`);

  } catch (error) {
    console.error(`❌ [Logo Proxy] Failed to fetch circular team logo for ID: ${teamId}:`, error);
    res.redirect('/assets/fallback-logo.svg');
  }
});

// Helper function to get country flag URL
function getCountryFlagUrl(countryName: string): string {
  const cleanName = countryName.replace(/\s*(U21|U20|U19|U18|U17)\s*/gi, '').trim();

  // Country code mapping
  const countryCodeMap: { [key: string]: string } = {
    'Iraq': 'IQ',
    'Hong Kong': 'HK',
    'Syria': 'SY',
    'Finland': 'FI',
    'San Marino': 'SM',
    'Belarus': 'BY',
    'Belgium': 'BE',
    'Malaysia': 'MY',
    'Singapore': 'SG',
    'Saudi Arabia': 'SA',
    'North Macedonia': 'MK',
    'FYR Macedonia': 'MK',
    'Macedonia': 'MK',
    'United Arab Emirates': 'AE',
    'UAE': 'AE'
  };

  const countryCode = countryCodeMap[cleanName] || 'XX';
  return `https://flagsapi.com/${countryCode}/flat/64.png`;
}

export default router;