

import https from 'https';

const BASKETBALL_API_KEY = '81bc62b91b1190622beda24ee23fbd1a';

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

      console.log(`🏀 [BasketballAPI] Making request to: https://v1.basketball.api-sports.io${path}`);

      const req = https.request(options, function (res) {
        const chunks: Buffer[] = [];

        res.on('data', function (chunk) {
          chunks.push(chunk);
        });

        res.on('end', function () {
          try {
            const body = Buffer.concat(chunks);
            const responseText = body.toString();
            
            console.log(`🏀 [BasketballAPI] Response status: ${res.statusCode}`);
            console.log(`🏀 [BasketballAPI] Response preview: ${responseText.substring(0, 200)}...`);
            
            const jsonData = JSON.parse(responseText);

            console.log(`✅ [BasketballAPI] Success for ${path}`, {
              status: res.statusCode,
              dataLength: jsonData?.response?.length || 0
            });
            
            resolve({
              success: true,
              data: jsonData
            });
          } catch (error) {
            console.error(`❌ [BasketballAPI] Parse error for ${path}:`, error);
            console.error(`Raw response: ${body.toString()}`);
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
      console.log(`🏀 [BasketballAPI] No fixtures for 2024-2025 season, trying 2024...`);
      // Try alternative season format (2024)
      response = await this.makeRequest(`/games?league=${leagueId}&season=2024`);
    }

    if (!response.success || !response.data?.response?.length) {
      console.log(`🏀 [BasketballAPI] No fixtures for 2024 season, trying 2023-2024...`);
      // Try previous season
      response = await this.makeRequest(`/games?league=${leagueId}&season=2023-2024`);
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

  async testConnection(): Promise<boolean> {
    console.log(`🧪 [BasketballAPI] Testing API connection...`);
    
    try {
      const response = await this.makeRequest('/status');
      console.log(`🧪 [BasketballAPI] Connection test result:`, response);
      return response.success;
    } catch (error) {
      console.error(`🧪 [BasketballAPI] Connection test failed:`, error);
      return false;
    }
  }
}

export const basketballApiService = new BasketballApiService();
