
import https from 'https';

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

    // Try current season first (2024-2025)
    let response = await this.makeRequest(`/games?league=${leagueId}&season=2024-2025`);
    
    if (!response.success || !response.data?.response?.length) {
      // Try alternative season format (2024)
      response = await this.makeRequest(`/games?league=${leagueId}&season=2024`);
    }

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

  async getAllLeagues(): Promise<any[]> {
    console.log(`🏀 [BasketballAPI] Fetching all basketball leagues`);

    const response = await this.makeRequest('/leagues');

    if (response.success && response.data?.response) {
      const leagues = response.data.response;
      console.log(`✅ [BasketballAPI] Retrieved ${leagues.length} leagues`);
      return leagues;
    }

    console.log(`❌ [BasketballAPI] No leagues found`);
    return [];
  }
}

export const basketballApiService = new BasketballApiService();
