import axios from 'axios';
import { FixtureResponse, LeagueResponse, PlayerStatistics } from '../types';
//import { b365ApiService } from './b365Api'; // Removed B365 API import

// Define standings type
interface LeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: any[][];
  };
}

// Initialize API client
const apiKey = process.env.RAPID_API_KEY || '';
console.log(`Using RapidAPI Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NOT SET'}`);

const apiClient = axios.create({
  baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
  headers: {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
  }
});

// Cache control - 5 minutes for live data, 1 hour for static data
const LIVE_DATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STATIC_DATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Cache objects
const fixturesCache = new Map<string, { data: any, timestamp: number }>();
const leaguesCache = new Map<string, { data: any, timestamp: number }>();
const playersCache = new Map<string, { data: any, timestamp: number }>();

// Mock data for popular leagues and teams
const popularLeagues: { [leagueId: number]: string[] } = {
  2: ['Real Madrid', 'Manchester City', 'Bayern Munich', 'PSG', 'Inter'], // Champions League
  3: ['Liverpool', 'Atalanta', 'Marseille', 'Roma', 'Leverkusen'], // Europa League
  39: ['Arsenal', 'Chelsea', 'Liverpool', 'Man United', 'Man City', 'Tottenham'], // Premier League
  140: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Athletic Bilbao', 'Sevilla'], // La Liga
  135: ['Inter', 'Milan', 'Juventus', 'Roma', 'Napoli'], // Serie A
  78: ['Bayern Munich', 'Dortmund', 'Leipzig', 'Leverkusen', 'Frankfurt'], // Bundesliga
};

export const rapidApiService = {
  /**
   * Get fixtures by date with prioritized live scores for today
   */
  async getFixturesByDate(date: string, fetchAll: boolean = false): Promise<FixtureResponse[]> {
    const cacheKey = `fixtures-date-${date}${fetchAll ? '-all' : ''}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    // Use shorter cache time for today's data (30 seconds) vs other dates (2 minutes)
    const cacheTime = isToday ? 30 * 1000 : 2 * 60 * 1000;
    if (cached && now - cached.timestamp < cacheTime) {
      return cached.data;
    }

    try {
      let allFixtures: FixtureResponse[] = [];

      // For today's matches, prioritize live data first
      if (isToday) {
        try {
          console.log(`Getting live fixtures first for today (${date})`);
          const liveFixtures = await this.getLiveFixtures();

          if (liveFixtures && liveFixtures.length > 0) {
            console.log(`Found ${liveFixtures.length} live fixtures for today`);
            // Validate live fixtures before adding
            const validLiveFixtures = liveFixtures.filter(fixture => 
              fixture && fixture.fixture && fixture.league && fixture.teams &&
              fixture.teams.home && fixture.teams.away &&
              fixture.teams.home.name && fixture.teams.away.name
            );
            allFixtures = [...validLiveFixtures];
          }
        } catch (liveError) {
          console.error('Error fetching live fixtures for today:', liveError);
        }
      }

      if (fetchAll) {
        console.log(`Fetching ALL fixtures for date ${date} from all countries and leagues`);

        // Fetch all fixtures for the date without league restrictions
        const response = await apiClient.get('/fixtures', {
          params: { 
            date: date,
            // Don't specify league parameter to get all leagues
          }
        });

        console.log(`API response for all fixtures on ${date}: status ${response.status}, results: ${response.data?.results || 0}`);

        if (response.data && response.data.response) {
          const dateFixtures = response.data.response;

          // Validate that all fixtures are for the correct date and have required data
          const validFixtures = dateFixtures.filter((fixture: any) => {
            try {
              // Check date validity
              if (!fixture?.fixture?.date) return false;
              const fixtureDate = new Date(fixture.fixture.date);
              const fixtureDateString = fixtureDate.toISOString().split('T')[0];
              if (fixtureDateString !== date) return false;

              // Check required data structure
              if (!fixture.league || !fixture.league.id || !fixture.league.name) return false;
              if (!fixture.teams || !fixture.teams.home || !fixture.teams.away) return false;
              if (!fixture.teams.home.name || !fixture.teams.away.name) return false;

              // Set default values for missing data
              if (!fixture.league.country) fixture.league.country = 'Unknown';
              if (!fixture.league.logo) fixture.league.logo = 'https://media.api-sports.io/football/leagues/1.png';
              if (!fixture.teams.home.logo) fixture.teams.home.logo = '/assets/fallback-logo.png';
              if (!fixture.teams.away.logo) fixture.teams.away.logo = '/assets/fallback-logo.png';

              // COMPREHENSIVE ESPORTS FILTERING - Enhanced version
              const leagueName = fixture.league.name?.toLowerCase() || '';
              const homeTeamName = fixture.teams.home.name?.toLowerCase() || '';
              const awayTeamName = fixture.teams.away.name?.toLowerCase() || '';

              // Expanded esports exclusion terms
              const esportsTerms = [
                'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual',
                'fifa', 'pro evolution soccer', 'pes', 'efootball', 'e-football',
                'volta', 'ultimate team', 'clubs', 'gaming', 'game',
                'simulator', 'simulation', 'digital', 'online',
                'battle', 'legend', 'champion', 'tournament online',
                'vs online', 'gt sport', 'rocket league', 'fc online',
                'dream league', 'top eleven', 'football manager',
                'championship manager', 'mobile', 'app'
              ];

              // Check if any esports term exists in league or team names
              const isEsports = esportsTerms.some(term => 
                leagueName.includes(term) || 
                homeTeamName.includes(term) || 
                awayTeamName.includes(term)
              );

              if (isEsports) {
                return false;
              }

              // CRITICAL: Filter out fixtures with null/undefined country (99% are esports)
              if (fixture.league.country === null || 
                  fixture.league.country === undefined || 
                  fixture.league.country === '') {
                console.log(`Filtering out fixture with null/empty country: ${fixture.league.name}`);
                return false;
              }

              // Additional check for suspicious country values
              if (typeof fixture.league.country === 'string' && 
                  fixture.league.country.toLowerCase().includes('unknown')) {
                console.log(`Filtering out fixture with unknown country: ${fixture.league.name}`);
                return false;
              }

              return true;
            } catch (error) {
              console.error('Error validating fixture:', error, fixture);
              return false;
            }
          });

          console.log(`Retrieved ${dateFixtures.length} fixtures, ${validFixtures.length} valid for date ${date}`);

          // Merge with live fixtures, avoiding duplicates
          const existingIds = new Set(allFixtures.map(f => f.fixture.id));
          const newFixtures = validFixtures.filter((f: any) => !existingIds.has(f.fixture.id));
          allFixtures = [...allFixtures, ...newFixtures];

          
        }
      } else {
        // Define popular leagues - matches core leagues
        const popularLeagues = [2, 3, 15, 39, 140, 135, 78, 848]; // Champions League, Europa League, FIFA Club World Cup, Premier League, La Liga, Serie A, Bundesliga, Conference League

        for (const leagueId of popularLeagues) {
          try {
            const leagueFixtures = await this.getFixturesByLeague(leagueId, 2024);
            const dateFixtures = leagueFixtures.filter(fixture => {
              const fixtureDate = new Date(fixture.fixture.date).toISOString().split('T')[0];
              return fixtureDate === date;
            });

            // Merge avoiding duplicates
            const existingIds = new Set(allFixtures.map(f => f.fixture.id));
            const newFixtures = dateFixtures.filter(f => !existingIds.has(f.fixture.id));
            allFixtures = [...allFixtures, ...newFixtures];
          } catch (error) {
            console.error(`Error fetching fixtures for league ${leagueId}:`, error);
            continue;
          }
        }

        console.log(`Popular leagues: ${allFixtures.length} total fixtures for ${date}`);
      }

      // Sort fixtures for today: Live first, then upcoming, then finished
      if (isToday && allFixtures.length > 0) {
        allFixtures.sort((a, b) => {
          const aStatus = a.fixture.status.short;
          const bStatus = b.fixture.status.short;

          // Live matches first
          const aLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
          const bLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);
          if (aLive && !bLive) return -1;
          if (!aLive && bLive) return 1;

          // Then upcoming matches
          const aUpcoming = aStatus === 'NS' && new Date(a.fixture.date) > new Date();
          const bUpcoming = bStatus === 'NS' && new Date(b.fixture.date) > new Date();
          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;

          // Finally by time
          return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
        });

        console.log(`Sorted ${allFixtures.length} fixtures for today - prioritizing live matches`);
      }

      fixturesCache.set(cacheKey, { 
        data: allFixtures, 
        timestamp: now 
      });

      return allFixtures;
    } catch (error) {
      console.error('RapidAPI: Error fetching fixtures by date:', error);

      // Try B365API as fallback for current date
      if (isToday) {
        /* Removed B365 Fallback
        try {
          console.log('RapidAPI failed for today, trying B365API live matches as fallback...');
          const b365LiveMatches = await b365ApiService.getLiveFootballMatches();

          if (b365LiveMatches && b365LiveMatches.length > 0) {
            const convertedMatches = b365LiveMatches.map(match => 
              b365ApiService.convertToRapidApiFormat(match)
            );

            console.log(`B365API Fallback: Retrieved ${convertedMatches.length} fixtures for today`);
            fixturesCache.set(cacheKey, { 
              data: convertedMatches, 
              timestamp: now 
            });
            return convertedMatches;
          }
        } catch (b365Error) {
          console.error('B365API Fallback also failed:', b365Error);
        }
        */
      }

      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      if (error instanceof Error) {
        throw new Error(`Failed to fetch fixtures: ${error.message}`);
      }
      throw new Error('Failed to fetch fixtures: Unknown error');
    }
  },

  /**
   * Get live fixtures with B365API fallback
   */
  async getLiveFixtures(): Promise<FixtureResponse[]> {
    const cacheKey = 'fixtures-live';
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    // Short cache time for live fixtures (30 seconds)
    if (cached && now - cached.timestamp < 30 * 1000) {
      return cached.data;
    }

    try {
      console.log('RapidAPI: Fetching live fixtures...');
      const response = await apiClient.get('/fixtures', {
        params: { live: 'all' }
      });

      if (response.data && response.data.response && response.data.response.length > 0) {
        // Enhanced esports filtering for live fixtures
        const filteredLiveFixtures = response.data.response.filter((fixture: any) => {
          const leagueName = fixture.league?.name?.toLowerCase() || '';
          const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || '';
          const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || '';

          // Same expanded esports terms
          const esportsTerms = [
            'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual',
            'fifa', 'pro evolution soccer', 'pes', 'efootball', 'e-football',
            'volta', 'ultimate team', 'clubs', 'gaming', 'game',
            'simulator', 'simulation', 'digital', 'online',
            'battle', 'legend', 'champion', 'tournament online',
            'vs online', 'gt sport', 'rocket league', 'fc online',
            'dream league', 'top eleven', 'football manager',
            'championship manager', 'mobile', 'app'
          ];

          const isEsports = esportsTerms.some(term => 
            leagueName.includes(term) || 
            homeTeamName.includes(term) || 
            awayTeamName.includes(term)
          );

          // Enhanced country filtering
          const hasInvalidCountry = fixture.league?.country === null || 
                                   fixture.league?.country === undefined || 
                                   fixture.league?.country === '' ||
                                   (typeof fixture.league?.country === 'string' && 
                                    fixture.league.country.toLowerCase().includes('unknown'));

          if (isEsports || hasInvalidCountry) {
            console.log(`Filtering out esports/invalid live fixture: ${fixture.league?.name} (country: ${fixture.league?.country})`);
            return false;
          }

          return true;
        });

        console.log(`RapidAPI: Retrieved ${response.data.response.length} live fixtures, ${filteredLiveFixtures.length} after filtering`);
        fixturesCache.set(cacheKey, { 
          data: filteredLiveFixtures, 
          timestamp: now 
        });
        return filteredLiveFixtures;
      }

      /*  Removed B365 API fallback
      // If RapidAPI returns no live fixtures, try B365API as fallback
      console.log('RapidAPI: No live fixtures found, trying B365API as fallback...');
      const b365LiveMatches = await b365ApiService.getLiveFootballMatches();

      if (b365LiveMatches && b365LiveMatches.length > 0) {
        // Convert B365 matches to RapidAPI format
        const convertedMatches = b365LiveMatches.map(match => 
          b365ApiService.convertToRapidApiFormat(match)
        );

        console.log(`B365API Fallback: Retrieved ${convertedMatches.length} live fixtures`);
        fixturesCache.set(cacheKey, { 
          data: convertedMatches, 
          timestamp: now 
        });
        return convertedMatches;
      }
      */

      return [];
    } catch (error) {
      console.error('RapidAPI: Error fetching live fixtures:', error);

      /* Removed B365 API fallback
      // Try B365API as fallback when RapidAPI fails
      try {
        console.log('RapidAPI failed, trying B365API as fallback...');
        const b365LiveMatches = await b365ApiService.getLiveFootballMatches();

        if (b365LiveMatches && b365LiveMatches.length > 0) {
          const convertedMatches = b365LiveMatches.map(match => 
            b365ApiService.convertToRapidApiFormat(match)
          );

          console.log(`B365API Fallback: Retrieved ${convertedMatches.length} live fixtures after RapidAPI error`);
          fixturesCache.set(cacheKey, { 
            data: convertedMatches, 
            timestamp: now 
          });
          return convertedMatches;
        }
      } catch (b365Error) {
        console.error('B365API Fallback also failed:', b365Error);
      }
      */

      // Use cached data if available
      if (cached?.data) {
        console.log('Using cached data due to both APIs failing');
        return cached.data;
      }

      console.error('All API requests failed and no cache available');
      return [];
    }
  },

  /**
   * Get fixture by ID
   */
  async getFixtureById(id: number): Promise<FixtureResponse | null> {
    const cacheKey = `fixture-${id}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < LIVE_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { id }
      });

      if (response.data && response.data.response && response.data.response.length > 0) {
        const fixtureData = response.data.response[0];
        fixturesCache.set(cacheKey, { 
          data: fixtureData, 
          timestamp: now 
        });
        return fixtureData;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching fixture with ID ${id}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return null;
    }
  },

  /**
   * Get fixtures by league ID and season
   */
  async getFixturesByLeague(leagueId: number, season: number): Promise<FixtureResponse[]> {
    const cacheKey = `fixtures-league-${leagueId}-${season}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching fixtures for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return [];
      }

      // Find the current season
      const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return [];
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(`Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`);

      const response = await apiClient.get('/fixtures', {
        params: { league: leagueId, season: correctSeason }
      });

      console.log(`Fixtures API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        // Include all fixtures from the requested league
        const filteredFixtures = response.data.response;

        // Log the fixtures count
        console.log(`Received ${response.data.response.length} fixtures for league ${leagueId}`);

        fixturesCache.set(cacheKey, { 
          data: filteredFixtures, 
          timestamp: now 
        });
        return filteredFixtures;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get all available leagues
   */
  async getLeagues(): Promise<LeagueResponse[]> {
    const cacheKey = 'leagues-all';
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get('/leagues');

      if (response.data && response.data.response) {
        leaguesCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error('Error fetching leagues:', error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get league by ID
   */
  async getLeagueById(id: number): Promise<LeagueResponse | null> {
    const cacheKey = `league-${id}`;
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching league with ID ${id}`);
      const response = await apiClient.get('/leagues', {
        params: { id }
      });

      console.log(`API response status: ${response.status}, data:`, 
        JSON.stringify(response.data).substring(0, 200) + '...');

      if (response.data && response.data.response && response.data.response.length > 0) {
        const leagueData = response.data.response[0];
        leaguesCache.set(cacheKey, { 
          data: leagueData, 
          timestamp: now 
        });
        return leagueData;
      }

      console.log(`No league data found for ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error fetching league with ID ${id}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return null;
    }
  },

  /**
   * Get top scorers for a league and season
   */
  async getTopScorers(leagueId: number, season: number): Promise<PlayerStatistics[]> {
    const cacheKey = `top-scorers-${leagueId}-${season}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Use shorter cache duration for top scorers (5 minutes)
    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    try {
      console.log(`Fetching top scorers for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return [];
      }

      // Find the current season
      const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return [];
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(`Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`);

      const response = await apiClient.get('/players/topscorers', {
        params: { league: leagueId, season: correctSeason }
      });

      console.log(`Top scorers API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        playersCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      console.log(`No top scorers data for league ${leagueId}, season ${correctSeason}`);
      return [];
    } catch (error) {
      console.error(`Error fetching top scorers for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get league standings by league ID and season
   */
  async getLeagueStandings(leagueId: number, season: number): Promise<LeagueStandings | null> {
    const cacheKey = `standings-${leagueId}-${season}`;
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching standings for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return null;
      }

      // Find the current season
      const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return null;
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(`Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`);

      const response = await apiClient.get('/standings', {
        params: { league: leagueId, season: correctSeason }
      });

      console.log(`Standings API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response && response.data.response.length > 0) {
        const standingsData = response.data.response[0];
        leaguesCache.set(cacheKey, { 
          data: standingsData, 
          timestamp: now 
        });
        return standingsData;
      }

      console.log(`No standings data for league ${leagueId}, season ${correctSeason}`);
      return null;
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return null;
    }
  }
};