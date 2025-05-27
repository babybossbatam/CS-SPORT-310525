import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidApiService } from "./services/rapidApi";
import { b365ApiService } from './services/b365Api';
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

      // Check cache first to prevent frequent API calls
      const cacheKey = all === 'true' ? `date-all:${date}` : `date:${date}`;
      const cachedFixtures = await storage.getCachedFixturesByLeague(cacheKey);
      if (cachedFixtures && cachedFixtures.length > 0) {
        // Check if cache is fresh (less than 30 minutes old)
        const now = new Date();
        const cacheTime = new Date(cachedFixtures[0].timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 30 * 60 * 1000) { // 30 minutes
          console.log(`Returning ${cachedFixtures.length} cached fixtures for date ${date} (all=${all})`);
          return res.json(cachedFixtures.map(fixture => fixture.data));
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
          const popularLeagues = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

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

      // If we got fixtures, cache them
      if (fixtures && fixtures.length > 0) {
        try {
          // Cache new fixtures - but use updateCachedFixture to handle potential duplicates
          // We'll update if exists or create if not exists
          for (const fixture of fixtures) {
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
      }

      // Return fixtures whether from API or empty array
      return res.json(fixtures || []);
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
        // Check if cache is fresh (less than 5 minutes old)
        const now = new Date();
        const cacheTime = new Date(cachedFixture.timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 5 * 60 * 1000) { // 5 minutes
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

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      // Check cache first
      const cachedLeague = await storage.getCachedLeague(id.toString());

      if (cachedLeague) {
        // Check if cache is fresh (less than 1 hour old)
        const now = new Date();
        const cacheTime = new Date(cachedLeague.timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 60 * 60 * 1000) { // 1 hour
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
      if (cachedLeague) {
        await storage.updateCachedLeague(id.toString(), league);
      } else {
        await storage.createCachedLeague({
          leagueId: id.toString(),
          data: league
        });
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

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
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

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
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

  // Europa League fixtures endpoint (League ID 3)
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
        // Return empty array instead of 404 error to avoid breaking frontend
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

      // First, let's verify the league exists
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
      // Get optional query parameters
      const category = req.query.category as string || 'sports';
      const sportType = req.query.sport as string || '';
      const count = parseInt(req.query.count as string || '10');

      // First, try RapidAPI for football news (Primary)
      if (sportType === 'football') {
        try {
          console.log("Trying RapidAPI for football news (Primary)");
          // Note: This would require implementing football news endpoint in RapidAPI
          // For now, we'll skip to GNews as RapidAPI doesn't have news endpoints
          throw new Error('RapidAPI news not implemented');
        } catch (rapidApiError) {
          console.log("RapidAPI for news not available, trying GNews...");
        }
      }

      // Second, try GNews API (Secondary fallback)
      try {
        const apiKey = process.env.GNEWS_API_KEY;
        if (!apiKey) {
          throw new Error('GNews API key is not configured');
        }

        console.log("Using GNews API for news (Secondary fallback)");

        // Build search query based on sport type
        let searchQuery = '';
        if (sportType) {
          // Map sport types to better search terms
          let searchTerm = sportType;

          // Map sport types to more specific search terms
          if (sportType === 'football') {
            // Try to get real football/soccer news by using specific European leagues/terms
            searchTerm = '(premier league OR bundesliga OR la liga OR serie a OR champions league OR uefa OR fifa) AND (soccer OR football) -NFL -bears -chiefs -ravens -bills';
          } else if (sportType === 'basketball') {
            searchTerm = 'basketball -NFL -football';
          } else if (sportType === 'baseball') {
            searchTerm = 'baseball -NFL -football -basketball';
          } else if (sportType === 'tennis') {
            searchTerm = 'tennis -NFL -football -basketball';
          } else if (sportType === 'hockey') {
            searchTerm = 'hockey -NFL -football -basketball';
          }

          searchQuery = `&q=${encodeURIComponent(searchTerm)}`;
        }

        // Build GNews API URL
        const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=us&max=${count}${searchQuery}&apikey=${apiKey}`;

        console.log(`Fetching news with URL: ${gnewsUrl.replace(apiKey, '[REDACTED]')}`);

        // Fetch news from GNews API
        const response = await fetch(gnewsUrl);
        const data = await response.json();

        if (data.errors) {
          throw new Error(`GNews API error: ${data.errors[0]}`);
        }

        // Transform GNews response to match our news article format
        const articles = data.articles.map((article: any, index: number) => ({
          id: index + 1,
          title: article.title,
          content: article.description,
          imageUrl: article.image || 'https://images.pexels.com/photos/47343/the-ball-stadion-football-the-pitch-47343.jpeg',
          source: article.source.name,
          url: article.url,
          publishedAt: article.publishedAt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        return res.json(articles);
      } catch (gnewsError) {
        console.error("GNews API failed:", gnewsError);
      }

      // Third, try SportMonks API as final fallback for football
      if (sportType === 'football' && process.env.SPORTMONKS_API_KEY) {
        try {
          console.log("Using SportMonks API for football news (Third fallback)");
          const apiKey = process.env.SPORTMONKS_API_KEY;

          // Try to fetch from the Serie A news endpoint with updated subscription
          // Note: The API documentation shows league_id=384 for Serie A
          const sportMonksUrl = `https://api.sportmonks.com/v3/football/news/post-match?api_token=${apiKey}&league_id=384`;
          console.log(`Fetching Serie A football news from SportMonks API (URL redacted for security)`);

          const response = await fetch(sportMonksUrl);
          const data = await response.json();

          // Print the data structure for debugging
          const apiResponse = JSON.stringify(data);
          console.log("SportMonks API response status:", response.status);
          console.log("SportMonks API response structure:", apiResponse.substring(0, 500) + "...");

          // Log API error if present
          if (data.message) {
            console.log("SportMonks API error message:", data.message);
          }

          // Check if response is valid
          if (response.ok && data.data && Array.isArray(data.data)) {
            console.log(`Successfully fetched ${data.data.length} football news articles from SportMonks`);
            console.log("First article sample:", JSON.stringify(data.data[0]));

            // Transform the SportMonks news data format to match our news article format
            const articles = data.data.slice(0, count).map((article: any, index: number) => {
              // Don't link directly to SportMonks but keep a reference to the league_id
              // Set the URL to our own site's path 
              const newsUrl = "/news/" + (index + 1);

              return {
                id: index + 1,
                title: article.title || 'Serie A News Update',
                // Use a generic content since the API doesn't provide detailed content
                content: `Serie A ${article.type || 'match'} news: ${article.title}`,
                // Use a default football image
                imageUrl: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg',
                source: "Serie A News",
                url: newsUrl,
                publishedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            });

            return res.json(articles);
          } else {
            console.warn("SportMonks API returned an invalid response or access denied:", data.message || "Unknown error");
            // Log the specific error message if available
            if (data.message) {
              console.warn(`SportMonks error message: ${data.message}`);
            }
          }
        } catch (error) {
          console.error("Error fetching from SportMonks API:", error);
        }
      }

      // Final fallback to local storage
      console.log("All external APIs failed, using local storage fallback");
      const articles = await storage.getAllNewsArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching news articles:", error);
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

  // Get fixtures by date
  apiRouter.get('/fixtures/date/:date', async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const { all } = req.query;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

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

  // Get B365 live matches directly
  apiRouter.get('/b365/live', async (req: Request, res: Response) => {
    try {
      const liveMatches = await b365ApiService.getLiveFootballMatches();
      res.json(liveMatches);
    } catch (error) {
      console.error('Error in /api/b365/live:', error);
      res.status(500).json({ 
        error: 'Failed to fetch B365 live matches',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get B365 events by date
  apiRouter.get('/b365/events/:date', async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const events = await b365ApiService.getEventsByDate(date);
      res.json(events);
    } catch (error) {
      console.error('Error in /api/b365/events:', error);
      res.status(500).json({ 
        error: 'Failed to fetch B365 events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
// Get fixtures by date with better data source fallback logic
  app.get('/api/fixtures/date/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const fetchAll = req.query.all === 'true';

      console.log(`API: Getting fixtures for date ${date}, fetchAll: ${fetchAll}`);

      // Check cache first
      const cacheKey = `fixtures-date-${date}${fetchAll ? '-all' : ''}`;
      const cached = cache.get(cacheKey);

      if (cached) {
        console.log(`Returning ${cached.length} cached fixtures for date ${date} (all=${fetchAll})`);
        return res.json(cached);
      }

      let fixtures = [];

      try {
        // Primary: RapidAPI
        fixtures = await rapidApiService.getFixturesByDate(date, fetchAll);
        console.log(`RapidAPI: Retrieved ${fixtures.length} fixtures for ${date}`);

        // Validate that fixtures actually match the requested date
        const validFixtures = fixtures.filter(fixture => {
          try {
            const fixtureDate = new Date(fixture.fixture.date);
            const fixtureDateString = fixtureDate.toISOString().split('T')[0];
            return fixtureDateString === date;
          } catch {
            return false;
          }
        });

        if (validFixtures.length !== fixtures.length) {
          console.log(`Date validation: filtered from ${fixtures.length} to ${validFixtures.length} fixtures`);
          fixtures = validFixtures;
        }

      } catch (rapidError) {
        console.error('RapidAPI failed for fixtures by date:', rapidError);

        try {
          // Secondary: B365API (for current date only)
          const today = new Date().toISOString().split('T')[0];
          if (date === today) {
            console.log('Trying B365API as secondary fallback...');
            const b365LiveMatches = await b365ApiService.getLiveFootballMatches();

            if (b365LiveMatches && b365LiveMatches.length > 0) {
              fixtures = b365LiveMatches.map(match => 
                b365ApiService.convertToRapidApiFormat(match)
              );
              console.log(`B365API: Retrieved ${fixtures.length} fixtures for today`);
            }
          }
        } catch (b365Error) {
          console.error('B365API also failed:', b365Error);
        }
      }

      // Cache the results with shorter cache time for more accurate data
      cache.set(cacheKey, fixtures, 2 * 60 * 1000); // 2 minute cache for fresher data

      console.log(`Returning ${fixtures.length} fixtures for date ${date}`);
      res.json(fixtures);
    } catch (error) {
      console.error(`Error getting fixtures for date ${req.params.date}:`, error);
      res.status(500).json({ error: 'Failed to fetch fixtures' });
    }
  });