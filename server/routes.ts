import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidApiService } from "./services/rapidApi";
import { livescoreApiService } from "./services/livescoreApi";
import { supabaseService } from "./services/supabase";
import { 
  insertUserSchema, 
  insertUserPreferencesSchema,
  insertCachedFixturesSchema,
  insertCachedLeaguesSchema
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

  // Football API routes - Using LivescoreAPI
  apiRouter.get("/fixtures/live", async (_req: Request, res: Response) => {
    try {
      // Try the new Livescore API first
      try {
        const fixtures = await livescoreApiService.getLiveFixtures();
        if (fixtures && fixtures.length > 0) {
          return res.json(fixtures);
        }
      } catch (livescoreError) {
        console.error('Livescore API error, falling back to RapidAPI:', livescoreError);
      }
      
      // Fall back to RapidAPI if needed
      const fixtures = await rapidApiService.getLiveFixtures();
      res.json(fixtures);
    } catch (error) {
      console.error('Error fetching live fixtures:', error);
      res.status(500).json({ message: "Failed to fetch live fixtures" });
    }
  });

  apiRouter.get("/fixtures/date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      
      // Try the new Livescore API first
      try {
        const fixtures = await livescoreApiService.getFixturesByDate(date);
        if (fixtures && fixtures.length > 0) {
          return res.json(fixtures);
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for date ${date}, falling back to RapidAPI:`, livescoreError);
      }
      
      // Fall back to RapidAPI if needed
      const fixtures = await rapidApiService.getFixturesByDate(date);
      res.json(fixtures);
    } catch (error) {
      console.error('Error fetching fixtures by date:', error);
      res.status(500).json({ message: "Failed to fetch fixtures by date" });
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
      
      // Try to fetch from Livescore API first
      let fixture;
      try {
        fixture = await livescoreApiService.getFixtureById(id);
        if (!fixture) {
          // If not found in Livescore API, try RapidAPI
          fixture = await rapidApiService.getFixtureById(id);
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for fixture ${id}, falling back to RapidAPI:`, livescoreError);
        // Fall back to RapidAPI if needed
        fixture = await rapidApiService.getFixtureById(id);
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
      // Try the new Livescore API first
      try {
        const leagues = await livescoreApiService.getLeagues();
        if (leagues && leagues.length > 0) {
          return res.json(leagues);
        }
      } catch (livescoreError) {
        console.error('Livescore API error for leagues, falling back to RapidAPI:', livescoreError);
      }
      
      // Fall back to RapidAPI if needed
      const leagues = await rapidApiService.getLeagues();
      res.json(leagues);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ message: "Failed to fetch leagues" });
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
      
      // Try to fetch from Livescore API first
      let league;
      try {
        league = await livescoreApiService.getLeagueById(id);
        if (!league) {
          // If not found in Livescore API, try RapidAPI
          league = await rapidApiService.getLeagueById(id);
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for league ${id}, falling back to RapidAPI:`, livescoreError);
        // Fall back to RapidAPI if needed
        league = await rapidApiService.getLeagueById(id);
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
      // Always use 2025 season data as requested, unless explicitly overridden in the query
      const season = parseInt(req.query.season as string) || 2025;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }
      
      console.log(`Fetching fixtures for league ${id} with fixed season ${season} as requested`);
      
      // Try the Livescore API first
      try {
        const fixtures = await livescoreApiService.getFixturesByLeague(id, season);
        if (fixtures && fixtures.length > 0) {
          console.log(`Received ${fixtures.length} fixtures for league ${id} from Livescore API`);
          return res.json(fixtures);
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for league fixtures ${id}, falling back to RapidAPI:`, livescoreError);
      }
      
      // Fall back to RapidAPI
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
      // Always use 2025 season data as requested, unless explicitly overridden in the query
      const season = parseInt(req.query.season as string) || 2025;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }
      
      console.log(`Fetching top scorers for league ${id} with fixed season ${season} as requested`);
      
      // Try the Livescore API first
      try {
        const topScorers = await livescoreApiService.getTopScorers(id, season);
        if (topScorers && topScorers.length > 0) {
          console.log(`Received top scorers data for league ${id} from Livescore API`);
          return res.json(topScorers);
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for top scorers ${id}, falling back to RapidAPI:`, livescoreError);
      }
      
      // Fall back to RapidAPI
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
      // Always use 2025 season data as requested, unless explicitly overridden in the query
      const season = parseInt(req.query.season as string) || 2025;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }
      
      console.log(`Fetching standings for league ${id} with fixed season ${season} as requested`);
      
      // Try the Livescore API first
      try {
        const standings = await livescoreApiService.getLeagueStandings(id, season);
        if (standings) {
          console.log(`Received standings data for league ${id} from Livescore API`);
          return res.json(standings);
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for standings ${id}, falling back to RapidAPI:`, livescoreError);
      }
      
      // Fall back to RapidAPI
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
      
      // Try the Livescore API first
      try {
        // Get league info first to confirm
        const leagueData = await livescoreApiService.getLeagueById(leagueId);
        
        if (leagueData) {
          console.log(`Europa League found in Livescore API: ${leagueData.league.name}, attempting to fetch fixtures...`);
          const fixtures = await livescoreApiService.getFixturesByLeague(leagueId, seasonToUse);
          
          if (fixtures && fixtures.length > 0) {
            console.log(`Europa League fixtures from Livescore API, count: ${fixtures.length}`);
            
            // Sort fixtures by date (newest first)
            const sortedFixtures = fixtures.sort((a, b) => {
              return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
            });
            
            console.log(`Returning ${sortedFixtures.length} sorted Europa League fixtures from Livescore API`);
            return res.json(sortedFixtures);
          }
        }
      } catch (livescoreError) {
        console.error(`Livescore API error for Europa League fixtures, falling back to RapidAPI:`, livescoreError);
      }
      
      // Fall back to RapidAPI
      // First, let's verify the league exists
      const leagueData = await rapidApiService.getLeagueById(leagueId);
      if (!leagueData) {
        console.error("Europa League data not found in API");
        return res.status(404).json({ message: "Europa League not found in API" });
      }
      
      console.log(`Europa League found in RapidAPI: ${leagueData.league.name}, attempting to fetch fixtures...`);
      console.log(`Using fixed season ${seasonToUse} for Europa League fixtures as requested`);
      
      // Fetch fixtures using the verified season
      const fixtures = await rapidApiService.getFixturesByLeague(leagueId, seasonToUse);
      
      console.log(`Europa League fixtures response received from RapidAPI, count: ${fixtures ? fixtures.length : 0}`);
      
      if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        console.warn("No Europa League fixtures found in API response");
        return res.status(404).json({ 
          message: "No Europa League fixtures found",
          leagueInfo: leagueData
        });
      }
      
      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });
      
      console.log(`Returning ${sortedFixtures.length} sorted Europa League fixtures from RapidAPI`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Europa League fixtures:", error);
      res.status(500).json({ 
        message: "Failed to fetch Europa League data",
        error: error instanceof Error ? error.message : String(error)
      });
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
        return res.status(404).json({ message: "Champions League not found in API" });
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
        
        // Provide mock data for testing if in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log("Sending empty array in response");
        }
        
        return res.status(404).json({ 
          message: "No Champions League fixtures found",
          leagueInfo: leagueData
        });
      }
      
      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });
      
      console.log(`Returning ${sortedFixtures.length} sorted Champions League fixtures`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Champions League fixtures:", error);
      res.status(500).json({ 
        message: "Failed to fetch Champions League data",
        error: error instanceof Error ? error.message : String(error)
      });
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
        return res.status(404).json({ message: "Bundesliga not found in API" });
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
        
        // Provide mock data for testing if in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log("Sending empty array in response");
        }
        
        return res.status(404).json({ 
          message: "No Bundesliga fixtures found",
          leagueInfo: leagueData
        });
      }
      
      // Sort fixtures by date (newest first)
      const sortedFixtures = [...fixtures].sort((a, b) => {
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      });
      
      console.log(`Returning ${sortedFixtures.length} sorted Bundesliga fixtures`);
      return res.json(sortedFixtures);
    } catch (error) {
      console.error("Error fetching Bundesliga fixtures:", error);
      res.status(500).json({ 
        message: "Failed to fetch Bundesliga data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
