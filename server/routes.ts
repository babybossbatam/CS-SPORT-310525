The code is modified to add error handling for fixture caching to prevent duplicate key violations from breaking the flow.
```
```replit_final_file
import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidApiService } from "./services/rapidApi";


import sportsradarApi from './services/sportsradarApi';
import soccersApi from './services/soccersApi';
import { supabaseService } from "./services/supabase";
import { 
  insertUserSchema, 
  insertUserPreferencesSchema,
  insertCachedFixturesSchema,
  insertCachedLeaguesSchema,
  insertNewsArticleSchema,
  CachedFixture,
  NewsArticle
} from "@shared/schema";
import { z } from "zod";
import { format, addDays, subDays } from 'date-fns';
// Removing uefaU21Routes import as requested
import cors from 'cors';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Health check endpoint
  apiRouter.get("/health", async (_req: Request, res: Response) => {
    try {
      // Test database connection
      await storage.getCachedFixturesByDate(new Date().toISOString().split('T')[0]);
      res.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({ 
        status: 'unhealthy', 
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // User authentication and management routes
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Create user in storage
      const newUser = await storage.createUser(userData);

      // Create empty preferences for the user
      await storage.createUserPreferences({
        userId: newUser.id,
        favoriteTeams: [],
        favoriteLeagues: [],
        favoriteMatches: [],
        region: "global"
      });

      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // User preferences routes
  apiRouter.get("/user/:userId/preferences", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      let preferences = await storage.getUserPreferences(userId);

      // If preferences don't exist, create default preferences
      if (!preferences) {
        // Check if user exists first
        const user = await storage.getUser(userId);

        if (!user) {
          // For demo purposes, we'll create a default preferences without checking for user existence
          // In production, you would return a 404 if the user doesn't exist

          const defaultPreferences = {
            userId,
            favoriteTeams: [33, 42, 49], // Default to Manchester United, Arsenal, Chelsea
            favoriteLeagues: [39, 2, 140], // Default to Premier League, Champions League, La Liga
            notifications: true,
            theme: 'light',
            region: 'global'
          };

          preferences = await storage.createUserPreferences(defaultPreferences);
        } else {
          // Create preferences for existing user
          preferences = await storage.createUserPreferences({
            userId,
            favoriteTeams: [],
            favoriteLeagues: [],
            notifications: true,
            theme: 'light',
            region: 'global'
          });
        }
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  apiRouter.patch("/user/:userId/preferences", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Partial validation of preferences
      const preferencesData = req.body;

      // Check if preferences exist
      let preferences = await storage.getUserPreferences(userId);

      if (!preferences) {
        // Create default preferences first
        preferences = await storage.createUserPreferences({
          userId,
          favoriteTeams: [],
          favoriteLeagues: [],
          notifications: true,
          theme: 'light',
          region: 'global',
          ...preferencesData // Apply the requested changes to new preferences
        });

        return res.status(201).json(preferences);
      }

      // Update existing preferences
      const updatedPreferences = await storage.updateUserPreferences(userId, preferencesData);

      if (!updatedPreferences) {
        return res.status(404).json({ message: "Failed to update user preferences" });
      }

      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Football API routes - Using API-Football
  apiRouter.get("/fixtures/live", async (_req: Request, res: Response) => {
    try {
      // Use API-Football (RapidAPI) only
      try {
        const fixtures = await rapidApiService.getLiveFixtures();
        console.log(`Retrieved ${fixtures.length} live fixtures from RapidAPI`);

        // NO CACHING for live fixtures - they need real-time updates
        console.log(`🔴 [LIVE API] Returning ${fixtures.length} fresh live fixtures (bypassing cache)`);

        // Only cache ended matches from the live response
        const endedMatches = fixtures.filter(fixture => 
          ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC'].includes(fixture.fixture.status.short)
        );

        if (endedMatches.length > 0) {
          console.log(`💾 [LIVE API] Caching ${endedMatches.length} ended matches from live response`);
          for (const fixture of endedMatches) {
            try {
              const fixtureId = fixture.fixture.id.toString();
              const existingFixture = await storage.getCachedFixture(fixtureId);

              if (existingFixture) {
                await storage.updateCachedFixture(fixtureId, fixture);
              } else {
                await storage.createCachedFixture({
                  fixtureId: fixtureId,
                  date: new Date().toISOString().split('T')[0],
                  league: fixture.league.id.toString(),
                  data: fixture
                });
              }
            } catch (cacheError) {
              console.error(`Error caching ended fixture ${fixture.fixture.id}:`, cacheError);
            }
          }
        }

        return res.json(fixtures);
      } catch (rapidApiError) {
        console.error('RapidAPI error for live fixtures:', rapidApiError);

        // If API fails, return empty array for live fixtures - no stale cache for live matches
        console.log(`❌ [LIVE API] RapidAPI failed for live fixtures - returning empty array (no stale cache for live data)`);
        return res.json([]);
      }
    } catch (error) {
      console.error('Error fetching live fixtures:', error);
      res.status(500).json({ message: "Failed to fetch live fixtures" });
    }
  });

  apiRouter.get("/fixtures/date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const { all } = req.query;

      // Validate date format first
      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log(`❌ [Routes] Invalid date format: ${date}`);
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      // Additional date validation - ensure it's a valid date
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== date) {
        console.log(`❌ [Routes] Invalid date value: ${date}`);
        return res.status(400).json({ error: 'Invalid date value' });
      }

      console.log(`🎯 [Routes] Processing multi-timezone request for date: ${date} (all=${all})`);
    console.log(`🎯 [Routes] Current server date: ${new Date().toISOString()}, requested date: ${date}`);

      // Enhanced cache checking - check multiple cache layers
      const cacheKey = all === 'true' ? `multi-tz-all:${date}` : `multi-tz:${date}`;
      const simpleCacheKey = `fixtures-date:${date}`;

      // First check dedicated multi-timezone cache
      let cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);

      // If not found, check simple date-based cache
      if (!cachedFixtures || cachedFixtures.length === 0) {
        cachedFixtures = await storage.getCachedFixturesByDate(date);
        console.log(`🔄 [Routes] Fallback to date cache for ${date}: ${cachedFixtures.length} fixtures found`);
      }

      if (cachedFixtures && cachedFixtures.length > 0) {
        const now = new Date();
        const cacheTime = new Date(cachedFixtures[0].timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        // Use smart cache durations based on date - EXTENDED CACHE TIMES
        const today = new Date().toISOString().split('T')[0];
        const isPastDate = date < today;
        const isToday = date === today;

        // Past dates: 7 days cache (matches are finished and stable)
        // Today: 2 hours cache (only live matches need frequent updates)
        // Future dates: 12 hours cache (schedules rarely change)
        const maxCacheAge = isPastDate ? 7 * 24 * 60 * 60 * 1000 : 
                       isToday ? 2 * 60 * 60 * 1000 : 
                       12 * 60 * 60 * 1000;

        if (cacheAge < maxCacheAge) {
          console.log(`✅ [Routes] Returning ${cachedFixtures.length} cached fixtures for date ${date} (age: ${Math.round(cacheAge / 60000)}min, maxAge: ${Math.round(maxCacheAge / 60000)}min)`);
          return res.json(cachedFixtures.map(fixture => fixture.data));
        } else {
          console.log(`⏰ [Routes] Cache expired for date ${date} (age: ${Math.round(cacheAge / 60000)}min > maxAge: ${Math.round(maxCacheAge / 60000)}min)`);
        }
      }

      let fetchedFreshData = false;

      // Calculate date ranges for multiple timezones
      const targetDate = new Date(date + 'T00:00:00Z');
      const previousDay = new Date(targetDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Format dates for API calls
      const datesToFetch = [
        previousDay.toISOString().split('T')[0],
        date,
        nextDay.toISOString().split('T')[0]
      ];

      console.log(`🌍 [Routes] Fetching fixtures for multi-timezone coverage:`, datesToFetch);

      let allFixtures: any[] = [];

      // Fetch fixtures for each date to cover all timezones
      for (const fetchDate of datesToFetch) {
        try {
          let dateFixtures: any[] = [];

          if (all === 'true') {
            dateFixtures = await rapidApiService.getFixturesByDate(fetchDate, true);
            fetchedFreshData = true;
          } else {
            const popularLeagues = [2, 3, 15, 39, 140, 135, 78, 848];
            dateFixtures = await rapidApiService.getFixturesByDate(fetchDate, false);
            dateFixtures = dateFixtures.filter(fixture => popularLeagues.includes(fixture.league.id));
            fetchedFreshData = true;
          }

          console.log(`📅 [Routes] Got ${dateFixtures.length} fixtures for ${fetchDate}`);
          allFixtures = [...allFixtures, ...dateFixtures];
        } catch (error) {
          console.error(`Error fetching fixtures for ${fetchDate}:`, error);
          continue;
        }
      }

      // Remove duplicates based on fixture ID
      const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
        index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
      );

      console.log(`📊 [Routes] Multi-timezone fetch results: ${allFixtures.length} total, ${uniqueFixtures.length} unique fixtures`);

      // Cache the multi-timezone fixtures with World competition priority (only for fresh data)
      if (fetchedFreshData && allFixtures.length > 0) { // Only cache if we fetched fresh data
        
// Cache individual fixtures for future use
        const cachePromises = allFixtures.map(async (fixture) => {
          try {
            await storage.createCachedFixture(
              `multi-tz-all:${date}:${fixture.fixture.id}`,
              fixture,
              `multi-tz-all:${date}`
            );
          } catch (cacheError) {
            // Log but don't throw - caching failures shouldn't break the response
            console.warn(`Failed to cache fixture ${fixture.fixture.id}:`, cacheError.message || cacheError);
          }
        });

        // Wait for all caching operations to complete (but don't block response)
        Promise.allSettled(cachePromises).catch(err => {
          console.warn('Some fixture caching operations failed:', err);
        });
      } else if (!fetchedFreshData) {
        console.log(`📦 [Routes] Skipped caching - using existing cached data for ${date}`);
      }

      console.log(`✅ [Routes] Returning ${uniqueFixtures.length} multi-timezone fixtures for ${date}`);
      return res.json(uniqueFixtures);
      // Fallback to cached fixtures if API fails
      if (cachedFixtures && cachedFixtures.length > 0) {
        console.log(`📦 [Routes] Returning ${cachedFixtures.length} stale cached fixtures for ${date}`);
        return res.json(cachedFixtures.map(fixture => fixture.data));
      }

      console.log(`📭 [Routes] No fixtures found for multi-timezone request: ${date}`);
      return res.json([]);
    } catch (error) {
      console.error('Error fetching multi-timezone fixtures:', error);
      return res.json([]);
    }
  });

  apiRouter.get("/fixtures/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid fixture ID" });
      }

      // Check cache first
      const cachedFixture = await storage.getCachedFixture(id.toString());

      if (cachedFixture) {
        // Check if cache is fresh (less than 1 hour old)
        const now = new Date();
        const cacheTime = new Date(cachedFixture.timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 60 * 60 * 1000) { // 1 hour (increased from 5 minutes)
          return res.json(cachedFixture.data);
        }
      }

      // Fetch fixture from API-Football only
      let fixture;
      try {
        fixture = await rapidApiService.getFixtureById(id);
      } catch (error) {
        console.error(`API-Football error for fixture ${id}:`, error);
      }

      if (!fixture) {
        return res.status(404).json({ message: "Fixture not found" });
      }

      // Cache the fixture
      try {
        if (cachedFixture) {
          await storage.updateCachedFixture(id.toString(), fixture);
        } else {
          await storage.createCachedFixture({
            fixtureId: id.toString(),
            data: fixture,
            league: fixture.league.id.toString(),
            date: new Date(fixture.fixture.date).toISOString().split('T')[0]
          });
        }
      } catch (cacheError) {
        console.error(`Error caching fixture ${id}:`, cacheError);
        // Continue even if caching fails to avoid breaking the API response
      }

      res.json(fixture);
    } catch (error) {
      console.error('Error fetching fixture:', error);
      res.status(500).json({ message: "Failed to fetch fixture" });
    }
  });

  // Get popular leagues endpoint - MUST be before parameterized routes
  apiRouter.get('/leagues/popular', async (req: Request, res: Response) => {
    try {
      console.log('API: Fetching popular leagues');

      // Try to get from cached leagues first
      const allLeagues = await storage.getAllCachedLeagues();

      // Define popular league IDs with priorities including recent international competitions
      const popularLeagueIds = [
        { id: 2, priority: 1 }, // Champions League
        { id: 3, priority: 2 }, // Europa League
        { id: 848, priority: 3 }, // Conference League
        { id: 5, priority: 4 }, // UEFA Nations League
        { id: 4, priority: 5 }, // Euro Championship
        { id: 15, priority: 6 }, // FIFA World Cup
        // World Cup Qualifications
        { id: 32, priority: 7 }, // World Cup Qualification - Europe
        { id: 33, priority: 7.1 }, // World Cup Qualification - Oceania
        { id: 34, priority: 7.2 }, // World Cup Qualification - South America
        { id: 35, priority: 7.3 }, // Asian Cup - Qualification
        { id: 36, priority: 7.4 }, // Africa Cup of Nations - Qualification
        { id: 37, priority: 7.5 }, // World Cup Qualification - Intercontinental Play-offs
        // Youth and U-League Championships (32 World Country Leagues)
        { id: 38, priority: 7.1 }, // UEFA U21 Championship (Euro U21)
        { id: 480, priority: 8.1 }, // Olympic Football Tournament
        { id: 875, priority: 8.2 }, // UEFA U19 Championship
        { id: 876, priority: 8.3 }, // UEFA U17 Championship
        { id: 877, priority: 8.4 }, // FIFA U20 World Cup
        { id: 878, priority: 8.5 }, // FIFA U17 World Cup
        { id: 879, priority: 8.6 }, // CONMEBOL Copa America U20
        { id: 880, priority: 8.7 }, // AFC U23 Championship
        { id: 881, priority: 8.8 }, // CAF U23 Cup of Nations
        { id: 882, priority: 8.9 }, // CONCACAF U20 Championship
        { id: 883, priority: 9.0 }, // OFC U20 Championship
        { id: 884, priority: 9.1 }, // FIFA U19 Women World Cup
        { id: 885, priority: 9.2 }, // FIFA U17 Women World Cup
        { id: 886, priority: 9.3 }, // UEFA Women U19 Championship
        { id: 887, priority: 9.4 }, // UEFA Women U17 Championship
        { id: 888, priority: 9.5 }, // CONMEBOL Copa America U17
        { id: 889, priority: 9.6 }, // AFC U19 Championship
        { id: 890, priority: 9.7 }, // AFC U16 Championship
        { id: 891, priority: 9.8 }, // CAF U20 Cup of Nations
        { id: 892, priority: 9.9 }, // CAF U17 Cup of Nations
        { id: 893, priority: 10.0 }, // CONCACAF U17 Championship
        { id: 894, priority: 10.1 }, // OFC U17 Championship
        { id: 895, priority: 10.2 }, // FIFA Beach Soccer World Cup
        { id: 896, priority: 10.3 }, // FIFA Futsal World Cup
        { id: 897, priority: 10.4 }, // FIFA Club World Cup U20
        { id: 898, priority: 10.5 }, // World Youth Championship
        { id: 899, priority: 10.6 }, // International Friendlies U21
        { id: 900, priority: 10.7 }, // International Friendlies U19
        { id: 901, priority: 10.8 }, // International Friendlies U18
        { id: 902, priority: 10.9 }, // International Friendlies U17
        { id: 903, priority: 11.0 }, // International Friendlies U16
        { id: 904, priority: 11.1 }, // FIFA Youth Olympic Tournament
        { id: 905, priority: 11.2 }, // World University Games Football
        // Major Domestic Leagues
        { id: 39, priority: 12 }, // Premier League
        { id: 140, priority: 13 }, // La Liga
        { id: 135, priority: 14 }, // Serie A
        { id: 78, priority: 15 }, // Bundesliga
        { id: 61, priority: 12 }, // Ligue 1
        { id: 307, priority: 13 }, // Saudi Pro League
        { id: 233, priority: 14 }, // Egyptian Premier League
        { id: 9, priority: 15 }, // Copa America
        { id: 10, priority: 16 }, // African Cup of Nations
        { id: 11, priority: 17 }, // Asian Cup
        { id: 137, priority: 18 }, // Coppa Italia
        { id: 45, priority: 19 }, // FA Cup
        { id: 40, priority: 20 }, // Community Shield
        { id: 48, priority: 21 } // EFL Cup
      ];

      // If we have cached leagues, filter and sort them
      if (allLeagues && allLeagues.length > 0) {
        const popularLeagues = popularLeagueIds
          .map(({ id, priority }) => {
            const league = allLeagues.find((l: any) => l.data?.league?.id === id);
            return league && league.data ? { ...league.data, priority } : null;
          })
          .filter((item): item is any => Boolean(item))
          .sort((a: any, b: any) => (a?.priority || 0) - (b?.priority || 0));

        console.log(`API: Returning ${popularLeagues.length} popular leagues from cache`);
        return res.json(popularLeagues);
      }

      // If no cached leagues, fetch from API and return popular ones
      const leagues = await rapidApiService.getLeagues();
      const popularLeagues = popularLeagueIds
        .map(({ id, priority }) => {
          const league = leagues.find((l: any) => l.league?.id === id);
          return league ? { ...league, priority } : null;
        })
        .filter((item): item is any => Boolean(item))
        .sort((a: any, b: any) => (a?.priority || 0) - (b?.priority || 0));

      console.log(`API: Returning ${popularLeagues.length} popular leagues from API`);
      res.json(popularLeagues);
    } catch (error) {
      console.error('Error fetching popular leagues:', error);
      res.status(500).json({ error: 'Failed to fetch popular leagues' });
    }
  });

  apiRouter.get("/leagues", async (_req: Request, res: Response) => {
    try {
      // Check for cached leagues first
      const cachedLeagues = await storage.getAllCachedLeagues();

      if (cachedLeagues && cachedLeagues.length > 0) {
        // Transform to the expected format
        const leagues = cachedLeagues.map(league => league.data);
        return res.json(leagues);
      }

      // Use API-Football (RapidAPI) only
      try {
        const leagues = await rapidApiService.getLeagues();

        // Cache each league from RapidAPI
        try {
          for (const league of leagues) {
            try {
              const leagueId = league.league.id.toString();
              const existingLeague = await storage.getCachedLeague(leagueId);

              if (existingLeague) {
                await storage.updateCachedLeague(leagueId, league);
              } else {
                await storage.createCachedLeague({
                  leagueId: leagueId,
                  data: league
                });
              }
            } catch (individualError) {
              // Log and continue with other leagues
              console.error(`Error caching league ${league.league.id}:`, individualError);
            }
          }
        } catch (cacheError) {
          console.error('Error caching leagues from RapidAPI:', cacheError);
        }

        return res.json(leagues);
      } catch (rapidApiError) {
        console.error('RapidAPI error for leagues:', rapidApiError);

        // If we reached here, try to use any cached leagues we have
        if (cachedLeagues && cachedLeagues.length > 0) {
          const leagues = cachedLeagues.map(league => league.data);
          return res.json(leagues);
        }

        // If all fails, return a minimal default set of popular leagues
        return res.json([
          {
            league: {
              id: 39,
              name: "Premier League",
              type: "League",
              logo: "https://media.api-sports.io/football/leagues/39.png",
              country: "England"
            },
            country: {
              name: "England",
              code: "GB",
              flag: "https://media.api-sports.io/flags/gb.svg"
            }
          },
          {
            league: {
              id: 78,
              name: "Bundesliga",
              type: "League",
              logo: "https://media.api-sports.io/football/leagues/78.png",
              country: "Germany"
            },
            country: {
              name: "Germany",
              code: "DE",
              flag: "https://media.api-sports.io/flags/de.svg"
            },
          },
          {
            league: {
              id: 2,
              name: "UEFA Champions League",
              type: "Cup",
              logo: "https://media.api-sports.io/football/leagues/2.png",
              country: "World"
            },
            country: {
              name: "World",
              code: "WO",
              flag: "https://media.api-sports.io/flags/wo.svg"
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      // Return cached data if available as a fallback
      const cachedLeagues = await storage.getAllCachedLeagues();

      if (cachedLeagues && cachedLeagues.length > 0) {
        const leagues = cachedLeagues.map(league => league.data);
        return res.json(leagues);
      }

      // If all else fails, return empty array instead of error
      res.json([]);
    }
  });

  apiRouter.get("/leagues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id) || !req.params.id || req.params.id.trim() === '') {
        return res.status(400).json({ message: 'Invalid league ID' });
      }

      // Check cache first
      const cachedLeague = await storage.getCachedLeague(id.toString());

      if (cachedLeague) {
        // Check if cache is fresh (less than 4 hours old)
        const now = new Date();
        const cacheTime = new Date(cachedLeague.timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 4 * 60 * 60 * 1000) { // 4 hours (increased from 1 hour)
          return res.json(cachedLeague.data);
        }
      }

      // Fetch from API-Football
      let league;
      try {
        league = await rapidApiService.getLeagueById(id);
      } catch (error) {
        console.error(`API-Football error for league ${id}:`, error);
      }

      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      // Cache the league
      try {
        if (cachedLeague) {
          await storage.updateCachedLeague(id.toString(), league);
        } else {
          await storage.createCachedLeague({
            leagueId: id.toString(),
            data: league
          });
        }
      } catch (cacheError) {
        console.error(`Error caching league ${id}:`, cacheError);
        // Continue even if caching fails to avoid breaking the API response
      }

      res.json(league);
    } catch (error) {
      console.error(`Error fetching league with ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch league" });
    }
  });

  apiRouter.get("/leagues/:id/fixtures", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Calculate current season based on date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      // If we're in the second half of the year, use next year as season
      const currentSeason = currentMonth >= 7 ? 
        currentDate.getFullYear() + 1 : 
        currentDate.getFullYear();
      const season = parseInt(req.query.season as string) || currentSeason;

      if (isNaN(id) || !req.params.id ||req.params.id.trim() === '') {
        return res.status(400).json({ message: 'Invalid league ID' });
      }

      // Check cache first with 2 hour duration for league fixtures
      const cacheKey = `league-fixtures-${id}-${season}`;
      const cachedFixtures = await storage.getCachedFixture(cacheKey);

      if (cachedFixtures) {
        const now = new Date();
        const cacheTime = new Date(cachedFixtures.timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        // Use 2 hour cache for league fixtures
        if (cacheAge < 2 * 60 * 60 * 100) {
          console.log(`Using cached fixtures for league ${id} (age: ${Math.round(cacheAge / 60000)}min)`);
          return res.json(