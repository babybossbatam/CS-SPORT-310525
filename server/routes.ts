import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidApiService } from "./services/rapidApi";
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
      
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
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
      
      // Update preferences
      const updatedPreferences = await storage.updateUserPreferences(userId, preferencesData);
      
      if (!updatedPreferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      res.json(updatedPreferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Football API routes
  apiRouter.get("/fixtures/live", async (_req: Request, res: Response) => {
    try {
      const fixtures = await rapidApiService.getLiveFixtures();
      res.json(fixtures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live fixtures" });
    }
  });

  apiRouter.get("/fixtures/date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const fixtures = await rapidApiService.getFixturesByDate(date);
      res.json(fixtures);
    } catch (error) {
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
      
      // Fetch from API if not in cache or cache is stale
      const fixture = await rapidApiService.getFixtureById(id);
      
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
      res.status(500).json({ message: "Failed to fetch fixture" });
    }
  });

  apiRouter.get("/leagues", async (_req: Request, res: Response) => {
    try {
      const leagues = await rapidApiService.getLeagues();
      res.json(leagues);
    } catch (error) {
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
      
      // Fetch from API if not in cache or cache is stale
      const league = await rapidApiService.getLeagueById(id);
      
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
      res.status(500).json({ message: "Failed to fetch league" });
    }
  });

  apiRouter.get("/leagues/:id/fixtures", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const season = parseInt(req.query.season as string) || new Date().getFullYear();
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }
      
      const fixtures = await rapidApiService.getFixturesByLeague(id, season);
      res.json(fixtures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch league fixtures" });
    }
  });

  apiRouter.get("/leagues/:id/topscorers", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const season = parseInt(req.query.season as string) || new Date().getFullYear();
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }
      
      const topScorers = await rapidApiService.getTopScorers(id, season);
      res.json(topScorers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top scorers" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
