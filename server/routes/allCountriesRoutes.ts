
import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { rapidApiService } from '../services/rapidApi';

const router = express.Router();

// Get all countries fixtures for a specific date
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { includeEsports = 'false', includeInvalid = 'false' } = req.query;

    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(`❌ [AllCountriesRoutes] Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`🌍 [AllCountriesRoutes] Fetching all countries fixtures for date: ${date}`);

    // Check cache first
    const cacheKey = `all-countries-fixtures:${date}`;
    const cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);

    if (cachedFixtures && cachedFixtures.length > 0) {
      const now = new Date();
      const cacheTime = new Date(cachedFixtures[0].timestamp);
      const cacheAge = now.getTime() - cacheTime.getTime();

      // Use smart cache durations based on date
      const today = new Date().toISOString().split('T')[0];
      const isPastDate = date < today;
      const isToday = date === today;

      const maxCacheAge = isPastDate ? 7 * 24 * 60 * 60 * 1000 : 
                         isToday ? 2 * 60 * 60 * 1000 : 
                         12 * 60 * 60 * 1000;

      if (cacheAge < maxCacheAge) {
        console.log(`✅ [AllCountriesRoutes] Returning ${cachedFixtures.length} cached all-countries fixtures for ${date}`);
        return res.json(cachedFixtures.map(fixture => fixture.data));
      }
    }

    // Fetch fixtures using the comprehensive date API
    const allFixtures = await rapidApiService.getFixturesByDate(date, true);

    // Apply filtering based on query parameters
    const validFixtures = allFixtures.filter(fixture => {
      try {
        // Basic validation
        if (!fixture?.league?.country || !fixture?.teams) return false;
        if (!fixture.teams.home?.name || !fixture.teams.away?.name) return false;
        
        // Enhanced esports filtering (unless explicitly included)
        if (includeEsports !== 'true') {
          const leagueName = fixture.league.name?.toLowerCase() || '';
          const homeTeam = fixture.teams.home.name?.toLowerCase() || '';
          const awayTeam = fixture.teams.away.name?.toLowerCase() || '';
          
          const esportsTerms = [
            'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual',
            'fifa', 'pro evolution soccer', 'pes', 'efootball', 'e-football'
          ];
          
          const isEsports = esportsTerms.some(term =>
            leagueName.includes(term) || homeTeam.includes(term) || awayTeam.includes(term)
          );
          
          if (isEsports) return false;
        }
        
        // Filter out invalid countries (unless explicitly included)
        if (includeInvalid !== 'true') {
          if (!fixture.league.country || 
              fixture.league.country === null || 
              fixture.league.country === undefined ||
              fixture.league.country === '') return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error validating fixture:', error);
        return false;
      }
    });

    // Cache the results
    if (validFixtures.length > 0) {
      for (const fixture of validFixtures) {
        try {
          const fixtureId = `${cacheKey}:${fixture.fixture.id}`;
          await storage.createCachedFixture({
            fixtureId: fixtureId,
            data: fixture,
            league: cacheKey,
            date: date
          });
        } catch (error) {
          console.error(`Error caching all-countries fixture ${fixture.fixture.id}:`, error);
        }
      }
    }

    console.log(`✅ [AllCountriesRoutes] Returning ${validFixtures.length} all-countries fixtures for ${date}`);
    res.json(validFixtures);

  } catch (error) {
    console.error('Error fetching all countries fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to fetch all countries fixtures',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get fixtures grouped by country for a specific date
router.get('/grouped/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { sortBy = 'matches', order = 'desc' } = req.query;

    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`🗂️ [AllCountriesRoutes] Fetching grouped fixtures for date: ${date}`);

    // Get all fixtures for the date
    const fixtures = await getAllCountriesFixtures(date);
    
    // Group by country
    const groupedByCountry = fixtures.reduce((acc: any, fixture: any) => {
      const country = fixture.league?.country || 'Unknown';
      
      if (!acc[country]) {
        acc[country] = {
          country,
          matches: [],
          totalCount: 0,
          liveCount: 0,
          leagues: new Set()
        };
      }
      
      acc[country].matches.push(fixture);
      acc[country].totalCount++;
      acc[country].leagues.add(fixture.league?.name);
      
      // Count live matches
      const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
        fixture.fixture?.status?.short
      );
      if (isLive) {
        acc[country].liveCount++;
      }
      
      return acc;
    }, {});

    // Convert to array and add league count
    const groupedArray = Object.values(groupedByCountry).map((group: any) => ({
      ...group,
      leagues: Array.from(group.leagues),
      leagueCount: group.leagues.length
    }));

    // Sort based on parameters
    groupedArray.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'live':
          aValue = a.liveCount;
          bValue = b.liveCount;
          break;
        case 'leagues':
          aValue = a.leagueCount;
          bValue = b.leagueCount;
          break;
        case 'alphabetical':
          aValue = a.country;
          bValue = b.country;
          return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'matches':
        default:
          aValue = a.totalCount;
          bValue = b.totalCount;
          break;
      }
      
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    console.log(`✅ [AllCountriesRoutes] Returning ${groupedArray.length} country groups for ${date}`);
    res.json({
      date,
      totalCountries: groupedArray.length,
      totalMatches: fixtures.length,
      countries: groupedArray
    });

  } catch (error) {
    console.error('Error fetching grouped fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to fetch grouped fixtures',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available countries for a specific date range
router.get('/countries/available', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate parameters are required' });
    }

    console.log(`🌍 [AllCountriesRoutes] Fetching available countries from ${startDate} to ${endDate}`);

    // For now, we'll check today's fixtures to get available countries
    // In a full implementation, you might want to check multiple dates
    const today = new Date().toISOString().split('T')[0];
    const fixtures = await getAllCountriesFixtures(today);
    
    const countries = [...new Set(fixtures.map(f => f.league?.country))].filter(Boolean);
    
    res.json({
      dateRange: { startDate, endDate },
      availableCountries: countries.sort(),
      totalCountries: countries.length
    });

  } catch (error) {
    console.error('Error fetching available countries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch available countries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get all countries fixtures
async function getAllCountriesFixtures(date: string) {
  // Check cache first
  const cacheKey = `all-countries-fixtures:${date}`;
  const cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);

  if (cachedFixtures && cachedFixtures.length > 0) {
    const now = new Date();
    const cacheTime = new Date(cachedFixtures[0].timestamp);
    const cacheAge = now.getTime() - cacheTime.getTime();

    const today = new Date().toISOString().split('T')[0];
    const isPastDate = date < today;
    const isToday = date === today;

    const maxCacheAge = isPastDate ? 7 * 24 * 60 * 60 * 1000 : 
                       isToday ? 2 * 60 * 60 * 1000 : 
                       12 * 60 * 60 * 1000;

    if (cacheAge < maxCacheAge) {
      return cachedFixtures.map(fixture => fixture.data);
    }
  }

  // Fetch fresh data
  const allFixtures = await rapidApiService.getFixturesByDate(date, true);
  
  // Apply basic filtering
  return allFixtures.filter(fixture => {
    if (!fixture?.league?.country || !fixture?.teams) return false;
    if (!fixture.teams.home?.name || !fixture.teams.away?.name) return false;
    
    // Filter out esports
    const leagueName = fixture.league.name?.toLowerCase() || '';
    const homeTeam = fixture.teams.home.name?.toLowerCase() || '';
    const awayTeam = fixture.teams.away.name?.toLowerCase() || '';
    
    const esportsTerms = [
      'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual',
      'fifa', 'pro evolution soccer', 'pes', 'efootball', 'e-football'
    ];
    
    const isEsports = esportsTerms.some(term =>
      leagueName.includes(term) || homeTeam.includes(term) || awayTeam.includes(term)
    );
    
    return !isEsports;
  });
}

export default router;
import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { rapidApiService } from '../services/rapidApi';

const router = express.Router();

// Get all countries fixtures for a specific date
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { includeEsports = 'false', includeInvalid = 'false' } = req.query;

    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(`❌ [AllCountriesRoutes] Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`🌍 [AllCountriesRoutes] Fetching all countries fixtures for date: ${date}`);

    // Check cache first
    const cacheKey = `all-countries-fixtures:${date}`;
    const cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);

    if (cachedFixtures && cachedFixtures.length > 0) {
      const now = new Date();
      const cacheTime = new Date(cachedFixtures[0].timestamp);
      const cacheAge = now.getTime() - cacheTime.getTime();

      // Use smart cache durations based on date
      const today = new Date().toISOString().split('T')[0];
      const isPastDate = date < today;
      const isToday = date === today;

      const maxCacheAge = isPastDate ? 7 * 24 * 60 * 60 * 1000 : 
                         isToday ? 2 * 60 * 60 * 1000 : 
                         12 * 60 * 60 * 1000;

      if (cacheAge < maxCacheAge) {
        console.log(`✅ [AllCountriesRoutes] Returning ${cachedFixtures.length} cached all-countries fixtures for ${date}`);
        return res.json(cachedFixtures.map(fixture => fixture.data));
      }
    }

    // Fetch fixtures using the comprehensive date API
    const allFixtures = await rapidApiService.getFixturesByDate(date, true);

    // Apply filtering based on query parameters
    const validFixtures = allFixtures.filter(fixture => {
      try {
        // Basic validation
        if (!fixture?.league?.country || !fixture?.teams) return false;
        if (!fixture.teams.home?.name || !fixture.teams.away?.name) return false;
        
        // Enhanced esports filtering (unless explicitly included)
        if (includeEsports !== 'true') {
          const leagueName = fixture.league.name?.toLowerCase() || '';
          const homeTeam = fixture.teams.home.name?.toLowerCase() || '';
          const awayTeam = fixture.teams.away.name?.toLowerCase() || '';
          
          const esportsTerms = [
            'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual',
            'fifa', 'pro evolution soccer', 'pes', 'efootball', 'e-football'
          ];
          
          const isEsports = esportsTerms.some(term =>
            leagueName.includes(term) || homeTeam.includes(term) || awayTeam.includes(term)
          );
          
          if (isEsports) return false;
        }
        
        // Filter out invalid countries (unless explicitly included)
        if (includeInvalid !== 'true') {
          if (!fixture.league.country || 
              fixture.league.country === null || 
              fixture.league.country === undefined ||
              fixture.league.country === '') return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error validating fixture:', error);
        return false;
      }
    });

    // Cache the results
    if (validFixtures.length > 0) {
      for (const fixture of validFixtures) {
        try {
          const fixtureId = `${cacheKey}:${fixture.fixture.id}`;
          await storage.createCachedFixture({
            fixtureId: fixtureId,
            data: fixture,
            league: cacheKey,
            date: date
          });
        } catch (error) {
          console.error(`Error caching all-countries fixture ${fixture.fixture.id}:`, error);
        }
      }
    }

    console.log(`✅ [AllCountriesRoutes] Returning ${validFixtures.length} all-countries fixtures for ${date}`);
    res.json(validFixtures);

  } catch (error) {
    console.error('Error fetching all countries fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to fetch all countries fixtures',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get fixtures grouped by country for a specific date
router.get('/grouped/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { sortBy = 'matches', order = 'desc' } = req.query;

    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`🗂️ [AllCountriesRoutes] Fetching grouped fixtures for date: ${date}`);

    // Get all fixtures for the date
    const fixtures = await getAllCountriesFixtures(date);
    
    // Group by country
    const groupedByCountry = fixtures.reduce((acc: any, fixture: any) => {
      const country = fixture.league?.country || 'Unknown';
      
      if (!acc[country]) {
        acc[country] = {
          country,
          matches: [],
          totalCount: 0,
          liveCount: 0,
          leagues: new Set()
        };
      }
      
      acc[country].matches.push(fixture);
      acc[country].totalCount++;
      acc[country].leagues.add(fixture.league?.name);
      
      // Count live matches
      const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
        fixture.fixture?.status?.short
      );
      if (isLive) {
        acc[country].liveCount++;
      }
      
      return acc;
    }, {});

    // Convert to array and add league count
    const groupedArray = Object.values(groupedByCountry).map((group: any) => ({
      ...group,
      leagues: Array.from(group.leagues),
      leagueCount: group.leagues.length
    }));

    // Sort based on parameters
    groupedArray.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'live':
          aValue = a.liveCount;
          bValue = b.liveCount;
          break;
        case 'leagues':
          aValue = a.leagueCount;
          bValue = b.leagueCount;
          break;
        case 'alphabetical':
          aValue = a.country;
          bValue = b.country;
          return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'matches':
        default:
          aValue = a.totalCount;
          bValue = b.totalCount;
          break;
      }
      
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    console.log(`✅ [AllCountriesRoutes] Returning ${groupedArray.length} country groups for ${date}`);
    res.json({
      date,
      totalCountries: groupedArray.length,
      totalMatches: fixtures.length,
      countries: groupedArray
    });

  } catch (error) {
    console.error('Error fetching grouped fixtures:', error);
    res.status(500).json({ 
      error: 'Failed to fetch grouped fixtures',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available countries for a specific date range
router.get('/countries/available', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate parameters are required' });
    }

    console.log(`🌍 [AllCountriesRoutes] Fetching available countries from ${startDate} to ${endDate}`);

    // For now, we'll check today's fixtures to get available countries
    // In a full implementation, you might want to check multiple dates
    const today = new Date().toISOString().split('T')[0];
    const fixtures = await getAllCountriesFixtures(today);
    
    const countries = [...new Set(fixtures.map(f => f.league?.country))].filter(Boolean);
    
    res.json({
      dateRange: { startDate, endDate },
      availableCountries: countries.sort(),
      totalCountries: countries.length
    });

  } catch (error) {
    console.error('Error fetching available countries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch available countries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get all countries fixtures
async function getAllCountriesFixtures(date: string) {
  // Check cache first
  const cacheKey = `all-countries-fixtures:${date}`;
  const cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);

  if (cachedFixtures && cachedFixtures.length > 0) {
    const now = new Date();
    const cacheTime = new Date(cachedFixtures[0].timestamp);
    const cacheAge = now.getTime() - cacheTime.getTime();

    const today = new Date().toISOString().split('T')[0];
    const isPastDate = date < today;
    const isToday = date === today;

    const maxCacheAge = isPastDate ? 7 * 24 * 60 * 60 * 1000 : 
                       isToday ? 2 * 60 * 60 * 1000 : 
                       12 * 60 * 60 * 1000;

    if (cacheAge < maxCacheAge) {
      return cachedFixtures.map(fixture => fixture.data);
    }
  }

  // Fetch fresh data
  const allFixtures = await rapidApiService.getFixturesByDate(date, true);
  
  // Apply basic filtering
  return allFixtures.filter(fixture => {
    if (!fixture?.league?.country || !fixture?.teams) return false;
    if (!fixture.teams.home?.name || !fixture.teams.away?.name) return false;
    
    // Filter out esports
    const leagueName = fixture.league.name?.toLowerCase() || '';
    const homeTeam = fixture.teams.home.name?.toLowerCase() || '';
    const awayTeam = fixture.teams.away.name?.toLowerCase() || '';
    
    const esportsTerms = [
      'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual',
      'fifa', 'pro evolution soccer', 'pes', 'efootball', 'e-football'
    ];
    
    const isEsports = esportsTerms.some(term =>
      leagueName.includes(term) || homeTeam.includes(term) || awayTeam.includes(term)
    );
    
    return !isEsports;
  });
}

export default router;
