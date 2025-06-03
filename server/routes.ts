
import sharp from 'sharp';

import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidApiService } from "./services/rapidApi";


import sportsradarApi from './services/sportsradarApi';
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

        // Cache the live fixtures
        for (const fixture of fixtures) {
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
            console.error(`Error caching live fixture ${fixture.fixture.id}:`, cacheError);
          }
        }

        return res.json(fixtures);
      } catch (rapidApiError) {
        console.error('RapidAPI error for live fixtures:', rapidApiError);

        // If both APIs fail, try to return cached live fixtures from today
        try {
          const todayDate = new Date().toISOString().split('T')[0];
          const cachedFixtures = await storage.getCachedFixturesByDate(todayDate);
          const liveFixtures = cachedFixtures
            .filter((fixture: CachedFixture) => {
              const fixtureData = fixture.data as any;
              return fixtureData && fixtureData.fixture && 
                (fixtureData.fixture.status.short === 'LIVE' || 
                fixtureData.fixture.status.short === '1H' || 
                fixtureData.fixture.status.short === '2H' || 
                fixtureData.fixture.status.short === 'HT');
            })
            .map((fixture: CachedFixture) => fixture.data);

          if (liveFixtures.length > 0) {
            console.log(`Using ${liveFixtures.length} cached live fixtures`);
            return res.json(liveFixtures);
          }
        } catch (cacheError) {
          console.error('Error retrieving cached live fixtures:', cacheError);
        }

        // If everything fails, return an empty array
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

      console.log(`🎯 [Routes] Processing request for validated date: ${date} (all=${all})`);
      console.log(`🎯 [Routes] Request details:`, {
        originalUrl: req.originalUrl,
        method: req.method,
        params: req.params,
        query: req.query,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'accept-timezone': req.headers['accept-timezone']
        },
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        serverTime: new Date().toISOString(),
        requestedDate: date,
        parsedDate: new Date(date).toISOString()
      });

      // Check cache first to prevent frequent API calls
      const cacheKey = all === 'true' ? `date-all:${date}` : `date:${date}`;
      const cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);
      if (cachedFixtures && cachedFixtures.length > 0) {
        // Check if cache is fresh (less than 2 hours old)
        const now = new Date();
        const cacheTime = new Date(cachedFixtures[0].timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 2 * 60 * 60 * 1000) { // 2 hours (increased from 30 minutes)
          // Validate cached fixtures have correct dates before serving
          const validCachedFixtures = cachedFixtures.filter(fixture => {
            const fixtureData = fixture.data as any;
            if (!fixtureData?.fixture?.date) return false;

            // Extract date directly from API string to avoid timezone conversion issues
            let fixtureDateString;
            const apiDateString = fixtureData.fixture.date;

            if (apiDateString.includes('T')) {
              fixtureDateString = apiDateString.split('T')[0];
            } else {
              fixtureDateString = apiDateString.split(' ')[0];
            }

            if (fixtureDateString !== date) {
              console.log(`🚫 [Routes] Found cached fixture with wrong date:`, {
                requestedDate: date,
                cachedFixtureDate: fixtureDateString,
                fixtureId: fixtureData.fixture.id,
                originalDate: fixtureData.fixture.date
              });
              return false;
            }
            return true;
          });

          if (validCachedFixtures.length > 0) {
            console.log(`✅ [Routes] Returning ${validCachedFixtures.length} validated cached fixtures for date ${date} (all=${all})`);
            return res.json(validCachedFixtures.map(fixture => fixture.data));
          } else {
            console.log(`🗑️ [Routes] All cached fixtures had wrong dates, will fetch fresh data for ${date}`);
          }
        } else {
          console.log(`⏰ [Routes] Cache expired for ${date}, age: ${Math.round(cacheAge / 60000)} minutes`);
        }
      }

      // If not in cache or cache is stale, get new data from API-Football
      let fixtures: any[] = [];

      try {
        if (all === 'true') {
          // Fetch ALL fixtures without any league filtering
          fixtures = await rapidApiService.getFixturesByDate(date, true);
          console.log(`Got ${fixtures.length} fixtures from ALL countries/leagues for date ${date}`);
        } else {
          // Define popular leagues - matches core leagues
          const popularLeagues = [2, 3, 15, 39, 140, 135, 78, 848]; // Champions League, Europa League, FIFA Club World Cup, Premier League, La Liga, Serie A, Bundesliga, Conference League

          // Use only API-Football (RapidAPI) with filtering
          fixtures = await rapidApiService.getFixturesByDate(date, false);

          // Filter to only popular leagues to reduce data
          fixtures = fixtures.filter(fixture => popularLeagues.includes(fixture.league.id));
          console.log(`Got ${fixtures.length} fixtures from popular leagues for date ${date}`);
        }
      } catch (error) {
        console.error(`API-Football error for date ${date}:`, error);

        // If API fails, return cached fixtures if available, even if stale
        if (cachedFixtures && cachedFixtures.length > 0) {
          console.log(`Returning ${cachedFixtures.length} stale cached fixtures for date ${date}`);
          return res.json(cachedFixtures.map(fixture => fixture.data));
        }

        // If no cached fixtures available, return empty array instead of error
        return res.json([]);
      }

      // If we got fixtures, validate dates before caching
      if (fixtures && fixtures.length > 0) {
        // Final validation: ensure all fixtures match the requested date
        const validFixtures = fixtures.filter(fixture => {
          if (!fixture?.fixture?.date) return false;

          // Extract date directly from API string to avoid timezone issues
          let fixtureDateString;
          const apiDateString = fixture.fixture.date;

          if (apiDateString.includes('T')) {
            fixtureDateString = apiDateString.split('T')[0];
          } else {
            fixtureDateString = apiDateString.split(' ')[0];
          }

          if (fixtureDateString !== date) {
            console.log(`🚫 [Routes] Final validation - rejecting fixture with wrong date:`, {
              requestedDate: date,
              apiReturnedDate: apiDateString,
              extractedDate: fixtureDateString,
              fixtureId: fixture.fixture.id
            });
            return false;
          }
          return true;
        });

        console.log(`📊 [Routes] Date validation results: ${fixtures.length} received, ${validFixtures.length} valid for ${date}`);

        if (validFixtures.length > 0) {
          try {
            // Cache only validated fixtures
            for (const fixture of validFixtures) {
              try {
                const fixtureId = `${cacheKey}:${fixture.fixture.id}`;
                const existingFixture = await storage.getCachedFixture(fixtureId);

                if (existingFixture) {
                  // Update existing fixture
                  await storage.updateCachedFixture(fixtureId, fixture);
                } else {
                  // Create new fixture
                  await storage.createCachedFixture({
                    fixtureId: fixtureId,
                    data: fixture,
                    league: cacheKey,
                    date: date
                  });
                }
              } catch (error) {
                // Log but continue with other fixtures
                const individualError = error as Error;
                console.error(`Error caching individual fixture ${fixture.fixture.id}:`, individualError.message || 'Unknown error');
              }
            }
        } catch (cacheError) {
            console.error(`Error caching fixtures for date ${date}:`, cacheError);
            // Continue even if caching fails
          }

          console.log(`✅ [Routes] Successfully cached and returning ${validFixtures.length} validated fixtures for ${date}`);
          return res.json(validFixtures);
        } else {
          console.log(`❌ [Routes] No valid fixtures found for ${date} after validation`);
          return res.json([]);
        }
      }

      // Return empty array if no fixtures
      console.log(`📭 [Routes] No fixtures received from API for ${date}`);
      return res.json([]);
    } catch (error) {
      console.error('Error fetching fixtures by date:', error);
      // Return empty array instead of error to avoid breaking frontend
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


  // New endpoint for square team logos
  app.get('/api/team-logo/square/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const size = parseInt(req.query.size as string) || 72; // Default 72x72 pixels
      
      console.log(`Fetching and resizing team logo for ID: ${teamId} to ${size}x${size}`);

      // Validate teamId
      if (!/^\d+$/.test(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID format' });
      }

      // Try multiple logo sources
      const logoUrls = [
        `https://media.api-sports.io/football/teams/${teamId}.png`,
        `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${teamId}`,
        `https://api.sportradar.com/soccer-images/production/competitors/${teamId}/logo.png`
      ];

      let imageBuffer = null;
      let sourceUrl = '';

      // Try each logo source
      for (const logoUrl of logoUrls) {
        try {
          const response = await fetch(logoUrl, {
            headers: {
              'accept': 'image/png,image/jpeg,image/svg+xml,image/*',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            sourceUrl = logoUrl;
            console.log(`Successfully fetched logo from: ${logoUrl}`);
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${logoUrl}:`, error.message);
          continue;
        }
      }

      // If no image found, return fallback
      if (!imageBuffer) {
        return res.status(404).json({ error: 'Logo not found from any source' });
      }

      // Resize image to square dimensions using Sharp
      const resizedBuffer = await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover', // This will crop the image to fill the square
          position: 'center'
        })
        .png()
        .toBuffer();

      // Set appropriate headers
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'X-Source-URL': sourceUrl
      });

      res.send(resizedBuffer);

    } catch (error) {
      console.error('Error processing square team logo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

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

  apiRouter.get("/leagues", async (_req: Request, res: Response) => {
    try {
      // Check for cached leagues first
      const cachedLeagues = await storage.getAllCachedLeagues();

  // Popular leagues endpoint
  apiRouter.get('/leagues/popular', async (req: Request, res: Response) => {
    try {
      // Try to get from cached leagues first
      const allLeagues = await storage.getAllCachedLeagues();

      // Define popular league IDs with priorities
      const popularLeagueIds = [
        { id: 2, priority: 1 }, // Champions League
        { id: 39, priority: 2 }, // Premier League
        { id: 140, priority: 3 }, // La Liga
        { id: 135, priority: 4 }, // Serie A
        { id: 78, priority: 5 }, // Bundesliga
        { id: 3, priority: 6 }, // Europa League
        { id: 137, priority: 7 }, // Coppa Italia
        { id: 45, priority: 8 }, // FA Cup
        { id: 40, priority: 9 }, // Community Shield
        { id: 48, priority: 10 } // EFL Cup
      ];

      // Filter and sort popular leagues
      const popularLeagues = popularLeagueIds
        .map(({ id, priority }) => {
          const league = allLeagues.find(l => l.data.league.id === id);
          return league ? { ...league.data, priority } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.priority - b.priority);

      res.json(popularLeagues);
    } catch (error) {
      console.error('Error fetching popular leagues:', error);
      res.status(500).json({ error: 'Failed to fetch popular leagues' });
    }
  });

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
            }
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

      if (isNaN(id) || !req.params.id || req.params.id.trim() === '') {
        return res.status(400).json({ message: 'Invalid league ID' });
      }

      console.log(`Fetching fixtures for league ${id} with fixed season ${season} as requested`);

      // Use API-Football (RapidAPI) only
      const fixtures = await rapidApiService.getFixturesByLeague(id, season);
      console.log(`Received ${fixtures ? fixtures.length : 0} fixtures for league ${id} from RapidAPI`);

      res.json(fixtures);
    } catch (error) {
      console.error(`Error fetching fixtures for league ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch league fixtures" });
    }
  });

  apiRouter.get("/leagues/:id/topscorers", async (req: Request, res: Response) => {
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

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      console.log(`Fetching top scorers for league ${id} with fixed season ${season} as requested`);

      // Use API-Football (RapidAPI) only
      const topScorers = await rapidApiService.getTopScorers(id, season);
      console.log(`Received top scorers data for league ${id} from RapidAPI`);

      res.json(topScorers);
    } catch (error) {
      console.error(`Error fetching top scorers for league ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch top scorers" });
    }
  });

  // New endpoint for league standings
  apiRouter.get("/leagues/:id/standings", async (req: Request, res: Response) => {
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

      if (isNaN(id) || !req.params.id || req.params.id.trim() === '') {
        return res.status(400).json({ message: 'Invalid league ID' });
      }

      console.log(`Fetching standings for league ${id} with fixed season ${season} as requested`);

      // Use API-Football (RapidAPI) only
      const standings = await rapidApiService.getLeagueStandings(id, season);
      console.log(`Received standings data for league ${id} from RapidAPI`);

      res.json(standings);
    } catch (error) {
      console.error(`Error fetching standings for league ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch standings data" });
    }
  });

  // Conference League fixtures endpoint (League ID 848)
  apiRouter.get("/conference-league/fixtures", async (_req: Request, res: Response) => {
    try {
      console.log("Conference League fixtures API call initiated");

      // Conference League ID is 848
      const leagueId = 848;
      // Always use 2025 season data as requested
      const seasonToUse = 2025;

      console.log(`Attempting to fetch Conference League (ID: ${leagueId}) fixtures for season ${seasonToUse}`);

      // Use API-Football (RapidAPI) only
      // First, let's verify the league exists
      const leagueData = await rapidApiService.getLeagueById(leagueId);
      if (!leagueData) {
        console.error("Conference League data not found in API");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      console.log(`Conference League found in RapidAPI: ${leagueData.league.name}, attempting to fetch fixtures...`);
      console.log(`Using fixed season ${seasonToUse} for Conference League fixtures as requested`);

      // Fetch fixtures using the verified season
      const fixtures = await rapidApiService.getFixturesByLeague(leagueId, seasonToUse);

      console.log(`Conference League fixtures response received from RapidAPI, count: ${fixtures ? fixtures.length : 0}`);

      if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        console.warn("No Conference League fixtures found in API response");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });

      console.log(`Returning ${sortedFixtures.length} sorted Conference League fixtures from RapidAPI`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Conference League fixtures:", error);
      // Return empty array instead of error to avoid breaking frontend
      return res.json([]);      }
  });

  // Europa Leaguefixtures endpoint (League ID 3)
  apiRouter.get("/europa-league/fixtures", async (_req: Request, res: Response) => {
    try {
      console.log("Europa League fixtures API call initiated");

      // Europa League ID is 3
      const leagueId = 3;
      // Always use 2025 season data as requested
      const seasonToUse = 2025;

      console.log(`Attempting to fetch Europa League (ID: ${leagueId}) fixtures for season ${seasonToUse}`);

      // Use API-Football (RapidAPI) only
      // First, let's verify the league exists
      const leagueData = await rapidApiService.getLeagueById(leagueId);
      if (!leagueData) {
        console.error("Europa League data not found in API");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      console.log(`Europa League found in RapidAPI: ${leagueData.league.name}, attempting to fetch fixtures...`);
      console.log(`Using fixed season ${seasonToUse} for Europa League fixtures as requested`);

      // Fetch fixtures using the verified season
      const fixtures = await rapidApiService.getFixturesByLeague(leagueId, seasonToUse);

      console.log(`Europa League fixtures response received from RapidAPI, count: ${fixtures ? fixtures.length : 0}`);

      if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        console.warn("No Europa League fixtures found in API response");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });

      console.log(`Returning ${sortedFixtures.length} sorted Europa League fixtures from RapidAPI`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Europa League fixtures:", error);
      // Return empty array instead of error to avoid breaking frontend
      return res.json([]);
    }
  });

  // Champions League fixtures endpoint (League ID 2)
  apiRouter.get("/champions-league/fixtures", async (_req: Request, res: Response) => {
    try {
      console.log("Champions League fixtures API call initiated");

      // Champions League ID is 2
      const leagueId = 2;
      // Use current year for the season
      const currentYear = new Date().getFullYear();

      console.log(`Attempting to fetch Champions League (ID: ${leagueId}) fixtures for season ${currentYear}`);

      // First, let's verify the league exists
      const leagueData = await rapidApiService.getLeagueById(leagueId);
      if (!leagueData) {
        console.error("Champions League data not found in API");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      console.log(`Champions League found: ${leagueData.league.name}, attempting to fetch fixtures...`);

      // Always use 2025 season data as requested
      const seasonToUse = 2025;

      console.log(`Using fixed season ${seasonToUse} for Champions League fixtures as requested`);

      // Fetch fixtures using the verified season
      const fixtures = await rapidApiService.getFixturesByLeague(leagueId, seasonToUse);

      console.log(`Champions League fixtures response received, count: ${fixtures ? fixtures.length : 0}`);

      if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        console.warn("No Champions League fixtures found in API response");
        // Return empty array instead of error to avoid breaking frontend
        return res.json([]);
      }

      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });

      console.log(`Returning ${sortedFixtures.length} sorted Champions League fixtures`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Champions League fixtures:", error);
      // Return empty array instead of error to avoid breaking frontend
      return res.json([]);
    }
  });

  // Bundesliga fixtures endpoint (League ID 78)
  apiRouter.get("/bundesliga/fixtures", async (_req: Request, res: Response) => {
    try {
      console.log("Bundesliga fixtures API call initiated");

      // Bundesliga ID is 78
      const leagueId = 78;
      // Use current year for the season
      const currentYear = new Date().getFullYear();

      console.log(`Attempting to fetch Bundesliga (ID: ${leagueId}) fixtures for season ${currentYear}`);

      // First, let's verify the leaguedata exists
      const leagueData = await rapidApiService.getLeagueById(leagueId);
      if (!leagueData) {
        console.error("Bundesliga data not found in API");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      console.log(`Bundesliga found: ${leagueData.league.name}, attempting to fetch fixtures...`);

      // Always use 2025 season data as requested
      const seasonToUse = 2025;

      console.log(`Using fixed season ${seasonToUse} for Bundesliga fixtures as requested`);

      // Fetch fixtures using the verified season
      const fixtures = await rapidApiService.getFixturesByLeague(leagueId, seasonToUse);

      console.log(`Bundesliga fixtures response received, count: ${fixtures ? fixtures.length : 0}`);

      if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        console.warn("No Bundesliga fixtures found in API response");
        // Return empty array instead of 404 error to avoid breaking frontend
        return res.json([]);
      }

      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });

      console.log(`Returning ${sortedFixtures.length} sorted Bundesliga fixtures`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Bundesliga fixtures:", error);
      // Return empty array instead of error to avoid breaking frontend
      return res.json([]);
    }
  });

  // News Article Routes
  apiRouter.get("/news", async (req: Request, res: Response) => {
    try {
      console.log("News API disabled - returning empty array");

      // Return empty array instead of making any external API calls
      res.json([]);
    } catch (error) {
      console.error("Error in news endpoint:", error);
      res.status(500).json({ message: "Failed to fetch news articles" });
    }
  });

  apiRouter.get("/news/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const article = await storage.getNewsArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching news article:", error);
      res.status(500).json({ message: "Failed to fetch news article" });
    }
  });

  apiRouter.post("/news", async (req: Request, res: Response) => {
    try {
      let articleData = insertNewsArticleSchema.parse(req.body);

      // Replace example.com URLs with our domain
      if (articleData.url && articleData.url.includes('example.com')) {
        // Use our primary domain directly
        articleData.url = articleData.url.replace(/https?:\/\/example\.com/i, 'https://cssport.vip');
      }

      const article = await storage.createNewsArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating news article:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  apiRouter.patch("/news/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const existingArticle = await storage.getNewsArticle(id);
      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      let updates = req.body;

      // Replace example.com URLs with our domain
      if (updates.url && updates.url.includes('example.com')) {
        // Use our primary domain directly
        updates.url = updates.url.replace(/https?:\/\/example\.com/i, 'https://cssport.vip');
      }

      const updatedArticle = await storage.updateNewsArticle(id, updates);

      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating news article:", error);
      res.status(500).json({ message: "Failed to update news article" });
    }
  });

  apiRouter.delete("/news/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const success = await storage.deleteNewsArticle(id);
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting news article:", error);
      res.status(500).json({ message: "Failed to delete news article" });
    }
  });

  // BetsAPI specific news endpoints
  apiRouter.get("/news/betsapi/sports/:sportId", async (req: Request, res: Response) => {
    try {
      const sportId = parseInt(req.params.sportId);
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 10;

      if (isNaN(sportId)) {
        return res.status(400).json({ message: "Invalid sport ID" });
      }

      const articles = await betsApiService.getSportsNews(sportId, page, perPage);
      const formattedArticles = articles.map((article, index) => 
        betsApiService.convertToStandardFormat(article, index)
      );

      res.json(formattedArticles);
    } catch (error) {
      console.error("Error fetching BetsAPI sports news:", error);
      res.status(500).json({ 
        message: "Failed to fetch sports news from BetsAPI",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  apiRouter.get("/news/betsapi/league/:leagueId", async (req: Request, res: Response) => {
    try {
      const leagueId = parseInt(req.params.leagueId);
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 10;

      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const articles = await betsApiService.getLeagueNews(leagueId, page, perPage);
      const formattedArticles = articles.map((article, index) => 
        betsApiService.convertToStandardFormat(article, index)
      );

      res.json(formattedArticles);
    } catch (error) {
      console.error("Error fetching BetsAPI league news:", error);
      res.status(500).json({ 
        message: "Failed to fetch league news from BetsAPI",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // SportsRadar flag endpoint (server-side to avoid CORS)
  apiRouter.get('/sportsradar/flags/:country', async (req: Request, res: Response) => {
    try {
      const { country } = req.params;
      const sanitizedCountry = country.toLowerCase().replace(/\s+/g, '_');

      // SportsRadar flag URL
      const flagUrl = `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${sanitizedCountry}/flag_24x24.png`;

      // Fetch the flag image
      const response = await fetch(flagUrl, {
        headers: {
          'accept': 'image/png,image/jpeg,image/svg+xml,image/*',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.send(Buffer.from(buffer));
      } else {
        console.warn(`SportsRadar flag not found for country: ${country}`);
        res.status(404).json({ error: 'Flag not found' });
      }
    } catch (error) {
      console.error(`Error fetching SportsRadar flag for ${req.params.country}:`, error);
      res.status(500).json({ error: 'Failed to fetch flag' });
    }
  });

  // SportsRadar league logo endpoint (server-side to avoid CORS)
  apiRouter.get('/sportsradar/leagues/:leagueId/logo', async (req: Request, res: Response) => {
    try {
      let { leagueId } = req.params;

      // If leagueId contains a URL, extract the actual league ID
      if (leagueId.includes('http')) {
        const urlDecoded = decodeURIComponent(leagueId);
        const leagueIdMatch = urlDecoded.match(/\/leagues\/(\d+)\.png/);
        if (leagueIdMatch && leagueIdMatch[1]) {
          leagueId = leagueIdMatch[1];
        } else {
          console.warn(`Could not extract league ID from URL: ${urlDecoded}`);
          return res.status(400).json({ error: 'Invalid league ID format' });
        }
      }

      // Validate that leagueId is numeric
      if (!/^\d+$/.test(leagueId)) {
        console.warn(`Invalid league ID format: ${leagueId}`);
        return res.status(400).json({ error: 'League ID must be numeric' });
      }

      console.log(`SportsRadar: Fetching logo for league ID: ${leagueId}`);

      // Try multiple SportsRadar logo formats for leagues
      const logoUrls = [
        `https://api.sportradar.com/soccer/production/v4/en/tournaments/${leagueId}/logo.png`,
        `https://api.sportradar.com/soccer-images/production/tournaments/${leagueId}/logo.png`,
        `https://imagecache.sportradar.com/production/soccer/tournaments/${leagueId}/logo.png`
      ];

      for (const logoUrl of logoUrls) {
        try {
          const response = await fetch(logoUrl, {
            headers: {
              'accept': 'image/png,image/jpeg,image/svg+xml,image/*',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || 'image/png';
            const buffer = await response.arrayBuffer();

            res.set('Content-Type', contentType);
            res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            res.send(Buffer.from(buffer));
            return;
          }
        } catch (error) {
          console.warn(`SportsRadar league logo URL failed: ${logoUrl}`, error);
          continue;
        }
      }

      console.warn(`SportsRadar league logo not found for league: ${leagueId}`);
      res.status(404).json({ error: 'League logo not found' });
    } catch (error) {
      console.error(`Error fetching SportsRadar league logo for ${req.params.leagueId}:`, error);
      res.status(500).json({ error: 'Failed to fetch league logo' });
    }
  });

  // SportsRadar team logo endpoint (server-side to avoid CORS)
  apiRouter.get('/sportsradar/teams/:teamId/logo', async (req: Request, res: Response) => {
    try {
      let { teamId } = req.params;

      // If teamId contains a URL, extract the actual team ID
      if (teamId.includes('http')) {
        const urlDecoded = decodeURIComponent(teamId);
        const teamIdMatch = urlDecoded.match(/\/teams\/(\d+)\.png/);
        if (teamIdMatch && teamIdMatch[1]) {
          teamId = teamIdMatch[1];
        } else {
          console.warn(`Could not extract team ID from URL: ${urlDecoded}`);
          return res.status(400).json({ error: 'Invalid team ID format' });
        }
      }

      // Validate that teamId is numeric
      if (!/^\d+$/.test(teamId)) {
        console.warn(`Invalid team ID format: ${teamId}`);
        return res.status(400).json({ error: 'Team ID must be numeric' });
      }

      console.log(`SportsRadar: Fetching logo for team ID: ${teamId}`);

      // Try multiple SportsRadar logo formats
      const logoUrls = [
        `https://api.sportradar.com/soccer/production/v4/en/competitors/${teamId}/profile.png`,
        `https://api.sportradar.com/soccer-images/production/competitors/${teamId}/logo.png`,
        `https://imagecache.sportradar.com/production/soccer/competitors/${teamId}/logo.png`
      ];

      for (const logoUrl of logoUrls) {
        try {
          const response = await fetch(logoUrl, {
            headers: {
              'accept': 'image/png,image/jpeg,image/svg+xml,image/*',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || 'image/png';
            const buffer = await response.arrayBuffer();

            res.set('Content-Type', contentType);
            res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
            res.send(Buffer.from(buffer));
            return;
          }
        } catch (error) {
          console.warn(`SportsRadar logo URL failed: ${logoUrl}`, error);
          continue;
        }
      }

      console.warn(`SportsRadar team logo not found for team: ${teamId}`);
      res.status(404).json({ error: 'Team logo not found' });
    } catch (error) {
      console.error(`Error fetching SportsRadar team logo for ${req.params.teamId}:`, error);
      res.status(500).json({ error: 'Failed to fetch team logo' });
    }
  });

  // Get fixtures by country and season
  apiRouter.get('/fixtures/country/:country', async (req: Request, res: Response) => {
    try {
      const { country } = req.params;
      const { season, league } = req.query;

      console.log(`API: Getting fixtures for country: ${country}, season: ${season}, league: ${league}`);

      // Get all available leagues first
      const allLeagues = await rapidApiService.getLeagues();

      // Filter leagues by country
      const countryLeagues = allLeagues.filter(leagueResponse => {
        const leagueCountry = leagueResponse.country?.name?.toLowerCase() || '';
        return leagueCountry.includes(country.toLowerCase());
      });

      console.log(`Found ${countryLeagues.length} leagues for country: ${country}`);

      let allFixtures: any[] = [];

      // Fetch fixtures for each league in the country
      for (const leagueResponse of countryLeagues.slice(0, 10)) { // Limit to top 10 leagues to avoid timeout
        try {
          const leagueId = leagueResponse.league.id;
          const seasonYear = season ? parseInt(season as string) : 2024;

          const leagueFixtures = await rapidApiService.getFixturesByLeague(leagueId, seasonYear);

          // Filter by specific league if requested
          if (league && !leagueResponse.league.name.toLowerCase().includes((league as string).toLowerCase())) {
            continue;
          }

          allFixtures = [...allFixtures, ...leagueFixtures];

          console.log(`Added ${leagueFixtures.length} fixtures from ${leagueResponse.league.name}`);
        } catch (error) {
          console.error(`Error fetching fixtures for league ${leagueResponse.league.id}:`, error);
          continue;
        }
      }

      // Sort by date
      allFixtures.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

      console.log(`Total fixtures for ${country}: ${allFixtures.length}`);

      // Server-side: Keep all fixtures - let client do precise date filtering
  // This ensures we capture fixtures from all timezones that might be valid
  const validatedFixtures = allFixtures.filter(fixture => {
    try {
      const apiDateString = fixture.fixture.date;
      const extractedDate = apiDateString.split('T')[0];

      // Allow fixtures from ±1 day to capture all timezone variations
      const targetDateObj = new Date(date);
      const previousDay = new Date(targetDateObj);
      previousDay.setDate(previousDay.getDate() - 1);
      const nextDay = new Date(targetDateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      const validDates = [
        previousDay.toISOString().split('T')[0],
        date,
        nextDay.toISOString().split('T')[0]
      ];

      if (!validDates.includes(extractedDate)) {
        console.log(`🚫 [Routes] Final validation - rejecting fixture outside date range: {
  requestedDate: '${date}',
  apiReturnedDate: '${apiDateString}',
  extractedDate: '${extractedDate}',
  fixtureId: ${fixture.fixture.id}
}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in final date validation:', error);
      return false;
    }
  });

      res.json({ 
        success: true, 
        fixtures: validatedFixtures,
        country: country,
        season: season || 2024,
        totalLeagues: countryLeagues.length,
        totalFixtures: validatedFixtures.length
      });
    } catch (error) {
      console.error('Error fetching fixtures by country:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch fixtures by country'
      });
    }
  });

  // Debug endpoint to test RapidAPI date requests directly
  apiRouter.get('/debug/rapidapi-date/:date', async (req: Request, res: Response) => {
    try {
      const { date } = req.params;

      console.log(`🔬 [DEBUG] Testing RapidAPI direct call for date: ${date}`);

      // Make direct API call with different timezone parameters
      const tests = [
        { timezone: 'UTC', name: 'UTC' },
        { timezone: 'Europe/London', name: 'London' },
        { timezone: 'America/New_York', name: 'New_York' },
        { name: 'No_Timezone' } // No timezone parameter
      ];

      const results = [];

      for (const test of tests) {
        try {
          const params: any = { date };
          if (test.timezone) {
            params.timezone = test.timezone;
          }

          console.log(`🧪 [DEBUG] Testing with params:`, params);

          const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?${new URLSearchParams(params)}`, {
            headers: {
              'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
          });

          const data = await response.json();

          if (data.response?.length > 0) {
            const sampleDates = data.response.slice(0, 5).map((f: any) => {
              const fixtureDate = new Date(f.fixture?.date);
              return {
                id: f.fixture?.id,
                returnedDate: f.fixture?.date,
                extractedDate: fixtureDate.toISOString().split('T')[0],
                matchesRequested: fixtureDate.toISOString().split('T')[0] === date
              };
            });

            results.push({
              testName: test.name,
              timezone: test.timezone || 'none',
              totalResults: data.response.length,
              sampleDates,
              correctDateCount: data.response.filter((f: any) => {
                const fixtureDate = new Date(f.fixture?.date);
                return fixtureDate.toISOString().split('T')[0] === date;
              }).length
            });
          } else {
            results.push({
              testName: test.name,
              timezone: test.timezone || 'none',
              totalResults: 0,
              error: 'No fixtures returned'
            });
          }
        } catch (error) {
          results.push({
            testName: test.name,
            timezone: test.timezone || 'none',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        requestedDate: date,
        serverTime: new Date().toISOString(),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        testResults: results
      });

    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({ error: 'Debug test failed' });
    }
  });

  // Get fixtures by date
  apiRouter.get('/fixtures/date/:date', async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const { all } = req.query;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    // Get fixtures for the requested date without timezone restrictions
  // This allows us to capture fixtures from all timezones for the given date
  const apiFromDate = requestedDate; // Use the date as-is
  const apiToDate = requestedDate; // Same day

      const fixtures = await rapidApiService.getFixturesByDate(date, all === 'true');
      console.log(`Got ${fixtures.length} fixtures ${all === 'true' ? 'from all leagues' : 'from popular leagues'} for date ${date}`);
      res.json(fixtures);
    } catch (error) {
      console.error('Error fetching fixtures by date:', error);
      res.status(500).json({ error: 'Failed to fetch fixtures' });
    }
  });

  // Get live fixtures (with B365API fallback)
  apiRouter.get("/fixtures/live", async (_req: Request, res: Response) => {
    try {
      // Use API-Football (RapidAPI) only
      try {
        const fixtures = await rapidApiService.getLiveFixtures();
        console.log(`Retrieved ${fixtures.length} live fixtures from RapidAPI`);

        // Cache the live fixtures
        for (const fixture of fixtures) {
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
            console.error(`Error caching live fixture ${fixture.fixture.id}:`, cacheError);
          }
        }

        return res.json(fixtures);
      } catch (rapidApiError) {
        console.error('RapidAPI error for live fixtures:', rapidApiError);

        // If both APIs fail, try to return cached live fixtures from today
        try {
          const todayDate = new Date().toISOString().split('T')[0];
          const cachedFixtures = await storage.getCachedFixturesByDate(todayDate);
          const liveFixtures = cachedFixtures
            .filter((fixture: CachedFixture) => {
              const fixtureData = fixture.data as any;
              return fixtureData && fixtureData.fixture && 
                (fixtureData.fixture.status.short === 'LIVE' || 
                fixtureData.fixture.status.short === '1H' || 
                fixtureData.fixture.status.short === '2H' || 
                fixtureData.fixture.status.short === 'HT');
            })
            .map((fixture: CachedFixture) => fixture.data);

          if (liveFixtures.length > 0) {
            console.log(`Using ${liveFixtures.length} cached live fixtures`);
            return res.json(liveFixtures);
          }
        } catch (cacheError) {
          console.error('Error retrieving cached live fixtures:', cacheError);
        }

        // If everything fails, return an empty array
        return res.json([]);
      }
    } catch (error) {
      console.error('Error fetching live fixtures:', error);
      res.status(500).json({ message: "Failed to fetch live fixtures" });
    }
  });



  // Get country flag with SportsRadar fallback
  apiRouter.get('/flags/:country', async (req: Request, res: Response) => {
    try {
      const { country } = req.params;

      if (!country) {
        return res.status(400).json({ 
          success: false, 
          error: 'Country parameter is required',
          fallbackUrl: '/assets/fallback-logo.svg',
          shouldExclude: true
        });
      }

      console.log(`Getting flag for country: ${country}`);

      // Try SportsRadar flag with timeout
      try {
        const sportsRadarFlag = await Promise.race([
          sportsradarApi.getCountryFlag(country),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SportsRadar timeout')), 5000)
          )
        ]) as string | null;

        if (sportsRadarFlag) {
          return res.json({ 
            success: true, 
            flagUrl: sportsRadarFlag,
            source: 'SportsRadar'
          });
        }
      } catch (sportsRadarError) {
        console.warn(`SportsRadar flag failed for ${country}:`, sportsRadarError);
      }

      // If SportsRadar fails, return fallback response
      console.warn(`🚫 Country ${country} will use fallback flag`);
      res.json({ 
        success: false, 
        message: 'Flag not found in SportsRadar - using fallback',
        fallbackUrl: '/assets/fallback-logo.svg',
        shouldExclude: false // Don't exclude, just use fallback
      });

    } catch (error) {
      console.error('Error fetching flag:', error);
      res.status(200).json({ // Return 200 to avoid network errors
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch flag',
        fallbackUrl: '/assets/fallback-logo.svg',
        shouldExclude: false
      });
    }
  });

  // Get available countries and their seasons
  apiRouter.get('/countries', async (req: Request, res: Response) => {
    try {
      console.log('API: Getting available countries and seasons');

      const allLeagues = await rapidApiService.getLeagues();

      // Group leagues by country and extract season information
      const countriesMap = new Map();

      allLeagues.forEach(leagueResponse => {
        const countryName = leagueResponse.country?.name || 'Unknown';
        const countryCode = leagueResponse.country?.code || '';
        const countryFlag = leagueResponse.country?.flag || '';

        if (!countriesMap.has(countryName)) {
          countriesMap.set(countryName, {
            name: countryName,
            code: countryCode,
            flag: countryFlag,
            leagues: [],
            seasons: new Set()
          });
        }

        const countryData = countriesMap.get(countryName);
        countryData.leagues.push({
          id: leagueResponse.league.id,
          name: leagueResponse.league.name,
          type: leagueResponse.league.type,
          logo: leagueResponse.league.logo
        });

        // Add available seasons for this league
        if (leagueResponse.seasons) {
          leagueResponse.seasons.forEach(season => {
            countryData.seasons.add(season.year);
          });
        }
      });

      // Convert to array and sort
      const countries = Array.from(countriesMap.values()).map(country => ({
        ...country,
        seasons: Array.from(country.seasons).sort((a, b) => b - a), // Sort seasons descending
        leagueCount: country.leagues.length
      })).sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Found ${countries.length} countries with leagues`);

      res.json({ 
        success: true, 
        countries: countries,
        totalCountries: countries.length,
        totalLeagues: allLeagues.length
      });
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch countries'
      });
    }
  });



  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// Utility function to get country flag with fallback chain
async function getCountryFlag(country: string): Promise<string | null> {
  try {
    // Try SportsRadar flag first
    let flagUrl = await sportsradarApi.getCountryFlag(country);

    if (flagUrl) {
      return flagUrl;
    }

    // If SportsRadar fails, try 365scores CDN
    console.log(`SportsRadar flag not found for ${country}, trying 365scores CDN fallback`);
    flagUrl = `https://sports.365scores.com/CDN/images/flags/${country}.svg`;

    // Check if the 365scores flag exists (naive check)
    const response = await fetch(flagUrl, { method: 'HEAD' });
    if (response.ok) {
      return flagUrl;
    } else {
      console.log(`365scores CDN flag not found for ${country}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching country flag:', error);
    return null;
  }
}