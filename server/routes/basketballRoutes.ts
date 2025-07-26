
import express from 'express';
import https from 'https';

const router = express.Router();

const BASKETBALL_API_KEY = process.env.RAPID_API_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527';

interface BasketballApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class BasketballApiService {
  private makeRequest(path: string): Promise<BasketballApiResponse> {
    return new Promise((resolve) => {
      const options = {
        method: 'GET',
        hostname: 'v1.basketball.api-sports.io',
        port: null,
        path: path,
        headers: {
          'x-rapidapi-key': BASKETBALL_API_KEY,
          'x-rapidapi-host': 'v1.basketball.api-sports.io'
        }
      };

      const req = https.request(options, function (res) {
        const chunks: Buffer[] = [];

        res.on('data', function (chunk) {
          chunks.push(chunk);
        });

        res.on('end', function () {
          try {
            const body = Buffer.concat(chunks);
            const responseText = body.toString();
            const jsonData = JSON.parse(responseText);

            console.log(`✅ [BasketballAPI] Success for ${path}`);
            resolve({
              success: true,
              data: jsonData
            });
          } catch (error) {
            console.error(`❌ [BasketballAPI] Parse error for ${path}:`, error);
            resolve({
              success: false,
              error: 'Failed to parse response'
            });
          }
        });
      });

      req.on('error', function (error) {
        console.error(`❌ [BasketballAPI] Request error for ${path}:`, error);
        resolve({
          success: false,
          error: error.message
        });
      });

      req.end();
    });
  }

  async getLeagueFixtures(leagueId: number): Promise<any[]> {
    console.log(`🏀 [BasketballAPI] Fetching fixtures for league ${leagueId}`);

    const response = await this.makeRequest(`/games?league=${leagueId}&season=2024-2025`);

    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [BasketballAPI] Retrieved ${fixtures.length} fixtures for league ${leagueId}`);
      return fixtures;
    }

    console.log(`❌ [BasketballAPI] No fixtures found for league ${leagueId}`);
    return [];
  }

  async getLiveFixtures(): Promise<any[]> {
    console.log(`🔴 [BasketballAPI] Fetching live basketball fixtures`);

    const response = await this.makeRequest('/games?live=all');

    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [BasketballAPI] Retrieved ${fixtures.length} live fixtures`);
      return fixtures;
    }

    console.log(`❌ [BasketballAPI] No live fixtures found`);
    return [];
  }

  async getFixturesByDate(date: string): Promise<any[]> {
    console.log(`🗓️ [BasketballAPI] Fetching fixtures for date: ${date}`);

    const response = await this.makeRequest(`/games?date=${date}`);

    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [BasketballAPI] Retrieved ${fixtures.length} fixtures for ${date}`);
      return fixtures;
    }

    console.log(`❌ [BasketballAPI] No fixtures found for ${date}`);
    return [];
  }
}

const basketballApiService = new BasketballApiService();

/**
 * GET /api/basketball/leagues/:leagueId/fixtures
 * Get fixtures for a specific basketball league
 */
router.get('/leagues/:leagueId/fixtures', async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId);
    
    if (!leagueId || isNaN(leagueId)) {
      return res.status(400).json({ error: 'Valid league ID is required' });
    }

    console.log(`🏀 [BasketballRoutes] Fetching fixtures for league ${leagueId}`);

    const fixtures = await basketballApiService.getLeagueFixtures(leagueId);
    
    res.json(fixtures);
  } catch (error) {
    console.error('Error fetching basketball league fixtures:', error);
    res.status(500).json({ error: 'Failed to fetch basketball fixtures' });
  }
});

/**
 * GET /api/basketball/live
 * Get live basketball fixtures
 */
router.get('/live', async (req, res) => {
  try {
    console.log(`🔴 [BasketballRoutes] Fetching live basketball fixtures`);

    const fixtures = await basketballApiService.getLiveFixtures();
    
    res.json(fixtures);
  } catch (error) {
    console.error('Error fetching live basketball fixtures:', error);
    res.status(500).json({ error: 'Failed to fetch live basketball fixtures' });
  }
});

/**
 * GET /api/basketball/fixtures
 * Get basketball fixtures by date
 */
router.get('/fixtures', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    console.log(`🗓️ [BasketballRoutes] Fetching fixtures for date: ${date}`);

    const fixtures = await basketballApiService.getFixturesByDate(date);
    
    res.json(fixtures);
  } catch (error) {
    console.error('Error fetching basketball fixtures by date:', error);
    res.status(500).json({ error: 'Failed to fetch basketball fixtures' });
  }
});

export default router;
