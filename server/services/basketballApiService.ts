

import https from 'https';

const BASKETBALL_API_KEY = '81bc62b91b1190622beda24ee23fbd1a';

interface BasketballApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class BasketballApiService {
  public makeRequest(path: string): Promise<BasketballApiResponse> {
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
            console.log(`🏀 [BasketballAPI] Raw response:`, responseText);
            
            const jsonData = JSON.parse(responseText);

            console.log(`✅ [BasketballAPI] Success for ${path}`, {
              status: res.statusCode,
              dataLength: jsonData?.response?.length || 0,
              fullResponse: jsonData
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

    // Get current date info for season detection
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Basketball seasons typically run from October to June of the following year
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    let seasonYear = currentYear;
    
    // If we're in January-June, we're in the second half of the season
    if (currentMonth >= 1 && currentMonth <= 6) {
      seasonYear = currentYear - 1;
    }

    const seasonFormats = [
      `${seasonYear}-${seasonYear + 1}`, // 2024-2025
      `${seasonYear}`,                    // 2024
      `${currentYear}`,                   // Current year
      `${currentYear - 1}`,              // Previous year
      `2024-2025`,                       // Fallback current season
      `2024`,                            // Fallback
      `2023-2024`                        // Previous season fallback
    ];

    for (const season of seasonFormats) {
      console.log(`🏀 [BasketballAPI] Trying season ${season} for league ${leagueId}`);
      const response = await this.makeRequest(`/games?league=${leagueId}&season=${season}`);
      
      if (response.success && response.data?.response?.length > 0) {
        const fixtures = response.data.response;
        console.log(`✅ [BasketballAPI] Retrieved ${fixtures.length} fixtures for league ${leagueId} in season ${season}`);
        return fixtures;
      }
    }

    // If no fixtures found with seasons, try without season parameter
    console.log(`🏀 [BasketballAPI] No fixtures found with seasons, trying without season for league ${leagueId}`);
    const response = await this.makeRequest(`/games?league=${leagueId}`);
    
    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [BasketballAPI] Retrieved ${fixtures.length} fixtures for league ${leagueId} (no season)`);
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
      // Test with a simple leagues endpoint first
      const response = await this.makeRequest('/leagues');
      console.log(`🧪 [BasketballAPI] Connection test result:`, response);
      
      if (response.success && response.data) {
        console.log(`🧪 [BasketballAPI] API working! Sample leagues:`, response.data.response?.slice(0, 3));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`🧪 [BasketballAPI] Connection test failed:`, error);
      return false;
    }
  }
}

export const basketballApiService = new BasketballApiService();
