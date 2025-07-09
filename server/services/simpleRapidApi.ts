
import https from 'https';

const API_KEY = process.env.RAPID_API_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527';

interface SimpleApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class SimpleRapidApiService {
  private makeRequest(path: string): Promise<SimpleApiResponse> {
    return new Promise((resolve) => {
      const options = {
        method: 'GET',
        hostname: 'api-football-v1.p.rapidapi.com',
        port: null,
        path: `/v3${path}`,
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
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
            
            console.log(`✅ [SimpleAPI] Success for ${path}`);
            resolve({
              success: true,
              data: jsonData
            });
          } catch (error) {
            console.error(`❌ [SimpleAPI] Parse error for ${path}:`, error);
            resolve({
              success: false,
              error: 'Failed to parse response'
            });
          }
        });
      });

      req.on('error', function (error) {
        console.error(`❌ [SimpleAPI] Request error for ${path}:`, error);
        resolve({
          success: false,
          error: error.message
        });
      });

      req.end();
    });
  }

  async getFixturesByDate(selectedDate: string): Promise<any[]> {
    console.log(`🔍 [SimpleAPI] Fetching fixtures for date: ${selectedDate}`);
    
    const response = await this.makeRequest(`/fixtures?date=${selectedDate}`);
    
    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [SimpleAPI] Retrieved ${fixtures.length} fixtures for ${selectedDate}`);
      return fixtures;
    }
    
    console.log(`❌ [SimpleAPI] No fixtures found for ${selectedDate}`);
    return [];
  }

  async getLiveFixtures(): Promise<any[]> {
    console.log(`🔴 [SimpleAPI] Fetching live fixtures`);
    
    const response = await this.makeRequest('/fixtures?live=all');
    
    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [SimpleAPI] Retrieved ${fixtures.length} live fixtures`);
      return fixtures;
    }
    
    console.log(`❌ [SimpleAPI] No live fixtures found`);
    return [];
  }

  async getLeagueFixtures(leagueId: number, season: number): Promise<any[]> {
    console.log(`🏆 [SimpleAPI] Fetching fixtures for league ${leagueId}, season ${season}`);
    
    const response = await this.makeRequest(`/fixtures?league=${leagueId}&season=${season}`);
    
    if (response.success && response.data?.response) {
      const fixtures = response.data.response;
      console.log(`✅ [SimpleAPI] Retrieved ${fixtures.length} fixtures for league ${leagueId}`);
      return fixtures;
    }
    
    console.log(`❌ [SimpleAPI] No fixtures found for league ${leagueId}`);
    return [];
  }

  async getFixtureById(fixtureId: number): Promise<any | null> {
    console.log(`🎯 [SimpleAPI] Fetching fixture ${fixtureId}`);
    
    const response = await this.makeRequest(`/fixtures?id=${fixtureId}`);
    
    if (response.success && response.data?.response && response.data.response.length > 0) {
      const fixture = response.data.response[0];
      console.log(`✅ [SimpleAPI] Retrieved fixture ${fixtureId}`);
      return fixture;
    }
    
    console.log(`❌ [SimpleAPI] Fixture ${fixtureId} not found`);
    return null;
  }
}

export const simpleRapidApi = new SimpleRapidApiService();
