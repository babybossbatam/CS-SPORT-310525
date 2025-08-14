import sharp from "sharp";

import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rapidApiService } from "./services/rapidApi";

import soccersApi from "./services/soccersApi";
import { supabaseService } from "./services/supabase";
import {
  insertUserSchema,
  insertUserPreferencesSchema,
  insertCachedFixturesSchema,
  insertCachedLeaguesSchema,
  insertNewsArticleSchema,
  CachedFixture,
  NewsArticle,
} from "@shared/schema";
import { z } from "zod";
import { format, addDays, subDays, isPast } from "date-fns";
// Removing uefaU21Routes import as requested
import cors from "cors";
import playerRoutes from './routes/playerRoutes';
import playerDataRoutes from './routes/playerDataRoutes';
import featuredMatchRoutes from "./routes/featuredMatchRoutes";
import { youtubeRoutes } from './routes/youtubeRoutes';
import { sofaScoreAPI } from './services/sofascoreApi';
import highlightsRoutes from './routes/highlightsRoutes';
import axios from "axios";
import { simpleRapidApi } from "./services/simpleRapidApi";
import athlete365Routes from './routes/athlete365Routes';
import scores365StatsRoutes from './routes/365scoresStatsRoutes';
import keyPlayersRoutes from './routes/365scoresKeyPlayersRoutes';
import playersRoutes from './routes/playersRoutes';
import selectiveLiveRoutes from './routes/selectiveLiveRoutes';
import selectiveUpdatesRoutes from './routes/selectiveUpdatesRoutes';
import predictionsRoutes from './routes/predictionsRoutes';
import basketballRoutes from './routes/basketballRoutes';
import basketballStandingsRoutes from './routes/basketballStandingsRoutes';
import basketballGamesRoutes from './routes/basketballGamesRoutes';
import playerVerificationRoutes from './routes/playerVerificationRoutes';
import { RapidAPI } from './utils/rapidApi'; // corrected rapidApi import
import translationRoutes from "./routes/translationRoutes";


// Cache duration constants
const LIVE_DATA_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for live data
const PAST_DATA_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for past data
const FUTURE_DATA_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for future data

// Simple in-memory cache
const fixturesCache = new Map<string, { data: any; timestamp: number }>();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Featured match routes for MyHomeFeaturedMatch component
  apiRouter.use("/api/featured-match", featuredMatchRoutes);
  app.use("/api/featured-match", featuredMatchRoutes);
  app.use("/api/youtube", youtubeRoutes);
  app.use("/api/highlights", highlightsRoutes);
  apiRouter.use('/api', playerRoutes);
  apiRouter.use('/api', playerDataRoutes);
  apiRouter.use('/api', playerVerificationRoutes);

  // Health check endpoint
  apiRouter.get("/health", async (_req: Request, res: Response) => {
    try {
      // Test database connection
      await storage.getCachedFixturesByDate(
        new Date().toISOString().split("T")[0],
      );
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
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
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }

      // Create user in storage
      const newUser = await storage.createUser(userData);

      // Create empty preferences for the user
      await storage.createUserPreferences({
        userId: newUser.id,
        favoriteTeams: [],
        favoriteLeagues: [],
        favoriteMatches: [],
        region: "global",
      });

      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // User preferences routes
  apiRouter.get(
    "/user/:userId/preferences",
    async (req: Request, res: Response) => {
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
              theme: "light",
              region: "global",
            };

            preferences =
              await storage.createUserPreferences(defaultPreferences);
          } else {
            // Create preferences for existing user
            preferences = await storage.createUserPreferences({
              userId,
              favoriteTeams: [],
              favoriteLeagues: [],
              notifications: true,
              theme: "light",
              region: "global",
            });
          }
        }

        res.json(preferences);
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        res.status(500).json({ message: "Failed to fetch user preferences" });
      }
    },
  );

  apiRouter.patch(
    "/user/:userId/preferences",
    async (req: Request, res: Response) => {
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
            theme: "light",
            region: "global",
            ...preferencesData, // Apply the requested changes to new preferences
          });

          return res.status(201).json(preferences);
        }

        // Update existing preferences
        const updatedPreferences = await storage.updateUserPreferences(
          userId,
          preferencesData,
        );

        if (!updatedPreferences) {
          return res
            .status(404)
            .json({ message: "Failed to update user preferences" });
        }

        res.json(updatedPreferences);
      } catch (error) {
        console.error("Error updating user preferences:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update user preferences" });
      }
    },
  );

  // Football API routes - Using API-Football
  apiRouter.get("/fixtures/live", async (req: Request, res: Response) => {
    try {
      const { skipFilter } = req.query;

      // Use API-Football (RapidAPI) only
      try {
        const fixtures = await rapidApiService.getLiveFixtures();
        console.log(
          `Retrieved ${fixtures.length} live fixtures from RapidAPI ${skipFilter ? "(SKIP FILTER MODE)" : ""}`,
        );

        // NO CACHING for live fixtures - they need real-time updates
        console.log(
          `🔴 [LIVE API] Returning ${fixtures.length} fresh live fixtures (bypassing cache)`,
        );

        // Set a flag on each fixture to indicate it's from live endpoint
        fixtures.forEach(fixture => {
          fixture.isLiveData = true;
          fixture.lastUpdated = Date.now();
        });

        // Only cache ended matches from the live response
        const endedMatches = fixtures.filter((fixture) =>
          ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC"].includes(
            fixture.fixture.status.short,
          ),
        );

        if (endedMatches.length > 0) {
          console.log(
            `💾 [LIVE API] Caching ${endedMatches.length} ended matches from live response`,
          );
          for (const fixture of endedMatches) {
            try {
              const fixtureId = fixture.fixture.id.toString();
              const existingFixture = await storage.getCachedFixture(fixtureId);

              if (existingFixture) {
                await storage.updateCachedFixture(fixtureId, fixture);
              } else {
                await storage.createCachedFixture({
                  fixtureId: fixtureId,
                  date: new Date().toISOString().split("T")[0],
                  league: fixture.league.id.toString(),
                  data: fixture,
                });
              }
            } catch (cacheError) {
              console.error(
                `Error caching ended fixture ${fixture.fixture.id}:`,
                cacheError,
              );
            }
          }
        }

        return res.json(fixtures);
      } catch (rapidApiError) {
        console.error("RapidAPI error for live fixtures:", rapidApiError);

        // If API fails, return empty array for live fixtures - no stale cache for live matches
        console.log(
          `❌ [LIVE API] RapidAPI failed for live fixtures - returning empty array (no stale cache for live data)`,
        );
        return res.json([]);
      }
    } catch (error) {
      console.error("Error fetching live fixtures:", error);
      res.status(500).json({ message: "Failed to fetch live fixtures" });
    }
  });

  // Get rounds for a specific league and season
  apiRouter.get("/fixtures/rounds", async (req: Request, res: Response) => {
    try {
      const { league, season } = req.query;

      if (!league) {
        return res.status(400).json({ error: "League parameter is required" });
      }

      const leagueId = parseInt(league as string);
      const seasonYear = season ? parseInt(season as string) : 2025;

      console.log(`📋 [Rounds API] Fetching rounds for league ${leagueId}, season ${seasonYear}`);

      // Use RapidAPI to get rounds
      const rounds = await rapidApiService.getFixtureRounds(leagueId, seasonYear);

      if (!rounds || rounds.length === 0) {
        console.log(`📋 [Rounds API] No rounds found for league ${leagueId}`);
        return res.json([]);
      }

      console.log(`📋 [Rounds API] Found ${rounds.length} rounds for league ${leagueId}`);
      res.json(rounds);

    } catch (error) {
      console.error("Error fetching rounds:", error);
      res.status(500).json({ error: "Failed to fetch rounds" });
    }
  });

  // Get fixtures by date with enhanced timezone support
  apiRouter.get('/fixtures/date/:date', async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const {
        all = 'false',
        skipFilter = 'false',
        timezone = 'false',
        leagues,
        minimal = 'true',
        world = 'false'
      } = req.query;

      console.log(`🎯 [Routes] Processing fixture request for date: ${date} (all=${all}, timezone=${timezone}, world=${world})`);
      console.log(`🎯 [Routes] Current server date: ${new Date().toISOString()}, requested date: ${date}`);

      const db = await storage.getDatabase();

      // Dynamic cache strategy based on request type
      const cacheKey = `fixtures-${date}-${all === 'true' ? 'all' : 'filtered'}-${timezone === 'true' ? 'tz' : 'std'}-${world === 'true' ? 'world' : 'reg'}`;
      const cached = await storage.getCachedFixture(cacheKey);

      // More aggressive caching for comprehensive requests
      const maxCacheAge = timezone === 'true' || world === 'true' ? 1 * 60 * 1000 : 2 * 60 * 1000; // 1-2 minutes

      if (cached && (Date.now() - new Date(cached.created_at).getTime()) < maxCacheAge) {
        const fixtures = JSON.parse(cached.data);
        console.log(`💾 [Routes] Using cached fixtures for ${date}: ${fixtures.length} matches`);
        return res.json(fixtures);
      }

      console.log(`⏰ [Routes] Cache expired for date ${date} (age: ${cached ? Math.round((Date.now() - new Date(cached.created_at).getTime()) / 60000) : 0}min > maxAge: ${Math.round(maxCacheAge / 60000)}min)`);

      let allFixtures: any[] = [];
      const uniqueFixtures = new Set<number>();

      // Strategy 1: Multi-timezone coverage
      if (timezone === 'true') {
        const previousDay = new Date(date);
        previousDay.setDate(previousDay.getDate() - 1);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const datesToFetch = [
          previousDay.toISOString().split('T')[0],
          date,
          nextDay.toISOString().split('T')[0]
        ];

        console.log(`🌍 [Routes] Fetching fixtures for multi-timezone coverage: ${JSON.stringify(datesToFetch)}`);

        for (const fetchDate of datesToFetch) {
          try {
            const dayFixtures = await rapidApiService.getFixturesByDate(fetchDate);
            console.log(`📅 [Routes] Got ${dayFixtures?.length || 0} fixtures for ${fetchDate}`);

            if (dayFixtures?.length) {
              const relevantFixtures = dayFixtures.filter((fixture: any) => {
                if (!fixture?.fixture?.id || uniqueFixtures.has(fixture.fixture.id)) return false;

                const fixtureDate = new Date(fixture.fixture.date);
                const targetDate = new Date(date);
                const timeDiff = Math.abs(fixtureDate.getTime() - targetDate.getTime());
                const hoursDiff = timeDiff / (1000 * 60 * 60);

                return hoursDiff <= 12;
              });

              relevantFixtures.forEach((fixture: any) => {
                uniqueFixtures.add(fixture.fixture.id);
                allFixtures.push(fixture);
              });
            }
          } catch (error) {
            console.error(`❌ [Routes] Error fetching fixtures for ${fetchDate}:`, error);
          }
        }
      }

      // Strategy 2: Specific leagues if requested
      if (leagues && typeof leagues === 'string') {
        const leagueIds = leagues.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        console.log(`🏆 [Routes] Fetching fixtures for specific leagues: ${leagueIds.join(', ')}`);

        for (const leagueId of leagueIds) {
          try {
            const leagueFixtures = await rapidApiService.getFixturesByDate(date, undefined, leagueId);
            if (leagueFixtures?.length) {
              leagueFixtures.forEach((fixture: any) => {
                if (fixture?.fixture?.id && !uniqueFixtures.has(fixture.fixture.id)) {
                  uniqueFixtures.add(fixture.fixture.id);
                  allFixtures.push(fixture);
                }
              });
            }
          } catch (error) {
            console.error(`❌ [Routes] Error fetching league ${leagueId} fixtures:`, error);
          }
        }
      }

      // Strategy 3: World competitions if requested
      if (world === 'true') {
        const worldLeagues = [2, 3, 4, 5, 848, 15, 22, 23]; // Major international competitions
        console.log(`🌍 [Routes] Fetching world competition fixtures`);

        for (const leagueId of worldLeagues) {
          try {
            const worldFixtures = await rapidApiService.getFixturesByDate(date, undefined, leagueId);
            if (worldFixtures?.length) {
              worldFixtures.forEach((fixture: any) => {
                if (fixture?.fixture?.id && !uniqueFixtures.has(fixture.fixture.id)) {
                  uniqueFixtures.add(fixture.fixture.id);
                  allFixtures.push(fixture);
                }
              });
            }
          } catch (error) {
            console.error(`❌ [Routes] Error fetching world league ${leagueId}:`, error);
          }
        }
      }

      // Strategy 4: Standard single-date fetch (fallback or primary)
      if (allFixtures.length === 0 || (!timezone && !leagues && !world)) {
        try {
          const dayFixtures = await rapidApiService.getFixturesByDate(date);
          console.log(`📅 [Routes] Got ${dayFixtures?.length || 0} standard fixtures for ${date}`);

          if (dayFixtures?.length) {
            dayFixtures.forEach((fixture: any) => {
              if (fixture?.fixture?.id && !uniqueFixtures.has(fixture.fixture.id)) {
                uniqueFixtures.add(fixture.fixture.id);
                allFixtures.push(fixture);
              }
            });
          }
        } catch (error) {
          console.error(`❌ [Routes] Error fetching standard fixtures:`, error);
        }
      }

      // Remove duplicates and sort
      const uniqueFixturesArray = allFixtures.filter((fixture, index, self) =>
        index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
      );

      uniqueFixturesArray.sort((a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );

      console.log(`📊 [Routes] Comprehensive fetch results: ${allFixtures.length} total, ${uniqueFixturesArray.length} unique fixtures`);

      // Cache the results
      try {
        await storage.createCachedFixture(cacheKey, JSON.stringify(uniqueFixturesArray), date);
      } catch (cacheError) {
        console.warn(`⚠️ [Routes] Failed to cache fixtures for ${date}:`, cacheError);
      }

      console.log(`✅ [Routes] Returning ${uniqueFixturesArray.length} fixtures for ${date}`);
      res.json(uniqueFixturesArray);

    } catch (error) {
      console.error(`❌ [Routes] Error in fixtures/date/${date}:`, error);
      res.status(500).json({
        error: 'Failed to fetch fixtures',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

        if (cacheAge < 60 * 60 * 1000) {
          // 1 hour (increased from 5 minutes)
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
            date: new Date(fixture.fixture.date).toISOString().split("T")[0],
          });
        }
      } catch (cacheError) {
        console.error(`Error caching fixture ${id}:`, cacheError);
        // Continue even if caching fails to avoid breaking the API response
      }

      res.json(fixture);
    } catch (error) {
      console.error("Error fetching fixture:", error);
      res.status(500).json({ message: "Failed to fetch fixture" });
    }
  });

  // Get popular leagues endpoint - MUST be before parameterized routes
  apiRouter.get("/leagues/popular", async (req: Request, res: Response) => {
    try {
      console.log("API: Fetching popular leagues");

      // Try to get from cached leagues first
      const allLeagues = await storage.getAllCachedLeagues();

      // Define popular league IDs with priorities including recent international competitions
      const popularLeagueIds = [
        { id: 2, priority: 1 }, // Champions League
        { id: 3, priority: 2 }, // Europa League
        { id: 848, priority: 3 }, // Conference League
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
        { id: 48, priority: 21 }, // EFL Cup
      ];

      // If we have cached leagues, filter and sort them
      if (allLeagues && allLeagues.length > 0) {
        const popularLeagues = popularLeagueIds
          .map(({ id, priority }) => {
            const league = allLeagues.find(
              (l: any) => l.data?.league?.id === id,
            );
            return league && league.data ? { ...league.data, priority } : null;
          })
          .filter((item): item is any => Boolean(item))
          .sort((a: any, b: any) => (a?.priority || 0) - (b?.priority || 0));

        console.log(
          `API: Returning ${popularLeagues.length} popular leagues from cache`,
        );
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

      console.log(
        `API: Returning ${popularLeagues.length} popular leagues from API`,
      );
      res.json(popularLeagues);
    } catch (error) {
      console.error("Error fetching popular leagues:", error);
      res.status(500).json({ error: "Failed to fetch popular leagues" });
    }
  });

  apiRouter.get("/leagues/all", async (_req: Request, res: Response) => {
    try {
      // Check for cached leagues first
      const cachedLeagues = await storage.getAllCachedLeagues();

      if (cachedLeagues && cachedLeagues.length > 0) {
        // Transform to the expected format
        const leagues = cachedLeagues.map((league) => league.data);
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
                  data: league,
                });
              }
            } catch (individualError) {
              // Log and continue with other leagues
              console.error(
                `Error caching league ${league.league.id}:`,
                individualError,
              );
            }
          }
        } catch (cacheError) {
          console.error("Error caching leagues from RapidAPI:", cacheError);
        }

        return res.json(leagues);
      } catch (rapidApiError) {
        console.error("RapidAPI error for leagues:", rapidApiError);

        // If we reached here, try to use any cached leagues we have
        if (cachedLeagues && cachedLeagues.length > 0) {
          const leagues = cachedLeagues.map((league) => league.data);
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
              country: "England",
            },
            country: {
              name: "England",
              code: "GB",
              flag: "https://media.api-sports.io/flags/gb.svg",
            },
          },
          {
            league: {
              id: 78,

name: "Bundesliga",
              type: "League",
              logo: "https://media.api-sports.io/football/leagues/78.png",
              country: "Germany",
            },
            country: {
              name: "Germany",
              code: "DE",
              flag: "https://media.api-sports.io/flags/de.svg",
            },
          },
          {
            league: {
              id: 2,
              name: "UEFA Champions League",
              type: "Cup",
              logo: "https://media.api-sports.io/football/leagues/2.png",
              country: "World",
            },
            country: {
              name: "World",
              code: "WO",
              flag: "https://media.api-sports.io/flags/wo.svg",
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
      // Return cached data if available as a fallback
      const cachedLeagues = await storage.getAllCachedLeagues();

      if (cachedLeagues && cachedLeagues.length > 0) {
        const leagues = cachedLeagues.map((league) => league.data);
        return res.json(leagues);
      }

      // If all else fails, return empty array instead of error
      res.json([]);
    }
  });

  // League information endpoint
  apiRouter.get("/leagues/:id", async (req: Request, res: Response) => {
    try {
      const leagueId = parseInt(req.params.id);

      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      console.log(`🔍 [API] Fetching detailed league information for league ${leagueId}`);

      // Use RapidAPI to get league information
      const leagueData = await rapidApiService.getLeagueById(leagueId);

      if (leagueData) {
        console.log(`✅ [API] Successfully retrieved league ${leagueId} information`);
        res.json(leagueData);
      } else {
        console.log(`❌ [API] No league data found for ID ${leagueId}`);
        res.status(404).json({ message: "League not found" });
      }
    } catch (error) {
      console.error(`❌ [API] Error fetching league ${req.params.id}:`, error);
      res.status(500).json({
        error: "Failed to fetch league information",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // League logo endpoint
  apiRouter.get("/league-logo/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id) || !req.params.id || req.params.id.trim() === "") {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      // Check cache first

      const cachedLeague = await storage.getCachedLeague(id.toString());

      if (cachedLeague) {
        // Check if cache is fresh (less than 4 hours old)
        const now = new Date();
        const cacheTime = new Date(cachedLeague.timestamp);
        const cacheAge = now.getTime() - cacheTime.getTime();

        if (cacheAge < 4 * 60 * 60 * 1000) {
          // 4 hours (increased from 1 hour)
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
            data: league,
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

  // Get fixtures by league ID
  apiRouter.get("/leagues/:id/fixtures", async (req: Request, res: Response) => {
    try {
      const leagueId = parseInt(req.params.id);
      const season = parseInt(req.query.season as string) || 2025;
      const forceRefresh = req.query.force === 'true';

      console.log(`API: Fetching fixtures for league ${leagueId}, season ${season}${forceRefresh ? ' (force refresh)' : ''}`);

      const fixtures = await rapidApiService.getFixturesByLeague(leagueId, season, forceRefresh);

      console.log(`API: Retrieved ${fixtures.length} fixtures for league ${leagueId}`);

      res.json(fixtures);
    } catch (error) {
      console.error(`Error in /leagues/${req.params.id}/fixtures:`, error);
      res.status(500).json({
        error: "Failed to fetch fixtures",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  apiRouter.get(
    "/leagues/:id/topscorers",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        // Calculate current season based on date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
        // If we're in the second half of the year, use next year as season
        const currentSeason =
          currentMonth >= 7
            ? currentDate.getFullYear() + 1
            : currentDate.getFullYear();
        const season = parseInt(req.query.season as string) || currentSeason;

        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid league ID" });
        }

        // Check cache first with longer duration for top scorers
        const cacheKey = `topscorers-${id}-${season}`;
        const cachedTopScorers = await storage.getCachedFixture(cacheKey);


// Popular teams endpoint
app.get('/api/teams/popular', async (req, res) => {
  try {
    // Set proper JSON content type header
    res.setHeader('Content-Type', 'application/json');

    // Return popular teams with correct structure
    const popularTeams = [
      {
        team: { id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png" },
        country: { name: "England" },
        popularity: 95,
      },
      {
        team: { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png" },
        country: { name: "England" },
        popularity: 92,
      },
      {
        team: { id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png" },
        country: { name: "England" },
        popularity: 90,
      },
      {
        team: { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
        country: { name: "Spain" },
        popularity: 88,
      },
      {
        team: { id: 529, name: "FC Barcelona", logo: "https://media.api-sports.io/football/teams/529.png" },
        country: { name: "Spain" },
        popularity: 85,
      },
      {
        team: { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
        country: { name: "England" },
        popularity: 83,
      },
      {
        team: { id: 49, name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png" },
        country: { name: "England" },
        popularity: 80,
      },
      {
        team: { id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png" },
        country: { name: "Germany" },
        popularity: 78,
      },
      {
        team: { id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png" },
        country: { name: "England" },
        popularity: 75,
      },
      {
        team: { id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png" },
        country: { name: "Italy" },
        popularity: 68,
      },
      {
        team: { id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png" },
        country: { name: "Italy" },
        popularity: 65,
      },
      {
        team: { id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png" },
        country: { name: "Germany" },
        popularity: 62,
      },
      {
        team: { id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png" },
        country: { name: "France" },
        popularity: 60,
      }
    ];

    console.log(`✅ [API] Returning ${popularTeams.length} popular teams`);
    res.json(popularTeams);
  } catch (error) {
    console.error('❌ [API] Error fetching popular teams:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to fetch popular teams' });
  }
});


        if (cachedTopScorers) {
          const now = new Date();
          const cacheTime = new Date(cachedTopScorers.timestamp);
          const cacheAge = now.getTime() - cacheTime.getTime();

          // Use 2 hour cache for top scorers for better performance
          if (cacheAge < 2 * 60 * 60 * 1000) {
            console.log(
              `Using cached top scorers for league ${id} (age: ${Math.round(cacheAge / 60000)}min)`,
            );
            return res.json(cachedTopScorers.data);
          }
        }

        console.log(
          `Fetching fresh top scorers for league ${id} with fixed season ${season}`,
        );

        // Use API-Football (RapidAPI) only
        const topScorers = await rapidApiService.getTopScorers(id, season);
        console.log(`Received top scorers data for league ${id} from RapidAPI`);

        // Cache the top scorers data
        try {
          if (cachedTopScorers) {
            await storage.updateCachedFixture(cacheKey, topScorers);
          } else {
            await storage.createCachedFixture({
              fixtureId: cacheKey,
              data: topScorers,
              league: id.toString(),
              date: new Date().toISOString().split("T")[0],
            });
          }
        } catch (cacheError) {
          console.error(
            `Error caching top scorers for league ${id}:`,
            cacheError,
          );
        }

        res.json(topScorers);
      } catch (error) {
        console.error(
          `Error fetching top scorers for league ID ${req.params.id}:`,
          error,
        );
        res.status(500).json({ message: "Failed to fetch top scorers" });
      }
    },
  );

  // New endpoint for league standings
  apiRouter.get(
    "/leagues/:id/standings",
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        // Calculate current season based on date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
        // If we're in the second half of the year, use next year as season
        const currentSeason =
          currentMonth >= 7
            ? currentDate.getFullYear() + 1
            : currentDate.getFullYear();
        const season = parseInt(req.query.season as string) || currentSeason;

        if (isNaN(id) || !req.params.id || req.params.id.trim() === "") {
          return res.status(400).json({ message: "Invalid league ID" });
        }

        // Check cache first with 4 hour duration for standings
        const cacheKey = `standings-${id}-${season}`;
        const cachedStandings = await storage.getCachedFixture(cacheKey);

        if (cachedStandings) {
          const now = new Date();
          const cacheTime = new Date(cachedStandings.timestamp);
          const cacheAge = now.getTime() - cacheTime.getTime();

          // Use 4 hour cache for standings
          if (cacheAge < 4 * 60 * 60 * 1000) {
            console.log(
              `Using cached standings for league ${id} (age: ${Math.round(cacheAge / 60000)}min)`,
            );
            return res.json(cachedStandings.data);
          }
        }

        console.log(
          `Fetching fresh standings for league ${id} with fixed season ${season}`,
        );

        // Use API-Football (RapidAPI) only
        const standings = await rapidApiService.getLeagueStandings(id, season);
        console.log(`Received standings data for league ${id} from RapidAPI`);

        // Cache the standings data
        try {
          if (cachedStandings) {
            await storage.updateCachedFixture(cacheKey, standings);
          } else {
            await storage.createCachedFixture({
              fixtureId: cacheKey,
              data: standings,
              league: id.toString(),
              date: new Date().toISOString().split("T")[0],
            });
          }
        } catch (cacheError) {
          console.error(
            `Error caching standings for league ${id}:`,
            cacheError,
          );
        }

        res.json(standings);
      } catch (error) {
        console.error(
          `Error fetching standings for league ID ${req.params.id}:`,
          error,
        );
        res.status(500).json({ message: "Failed to fetch standings data" });
      }
    },
  );

  // Conference League fixtures endpoint (League ID 848)
  apiRouter.get(
    "/conference-league/fixtures",
    async (_req: Request, res: Response) => {
      try {
        console.log("Conference League fixtures API call initiated");

        // Conference League ID is 848
        const leagueId = 848;
        // Always use 2025 season data as requested
        const seasonToUse = 2025;

        console.log(
          `Attempting to fetch Conference League (ID: ${leagueId}) fixtures for season ${seasonToUse}`,
        );

        // Use API-Football (RapidAPI) only
        // First, let's verify the league exists
        const leagueData = await rapidApiService.getLeagueById(leagueId);
        if (!leagueData) {
          console.error("Conference League data not found in API");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        console.log(
          `Conference League found in RapidAPI: ${leagueData.league.name}, attempting to fetch fixtures...`,
        );
        console.log(
          `Using fixed season ${seasonToUse} for Conference League fixtures as requested`,
        );

        // Fetch fixtures using the verified season
        const fixtures = await rapidApiService.getFixturesByLeague(
          leagueId,
          seasonToUse,
        );

        console.log(
          `Conference League fixtures response received from RapidAPI, count: ${fixtures ? fixtures.length : 0}`,
        );

        if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
          console.warn("No Conference League fixtures found in API response");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        // Sort fixtures by date (newest first)
        const sortedFixtures = [...fixtures].sort((a, b) => {
          return (
            new Date(b.fixture.date).getTime() -
            new Date(a.fixture.date).getTime()
          );
        });

        console.log(
          `Returning ${sortedFixtures.length} sorted Conference League fixtures from RapidAPI`,
        );
        return res.json(sortedFixtures);
      } catch (error) {
        console.error("Error fetching Conference League fixtures:", error);
        // Return empty array instead of error to avoid breaking frontend
        return res.json([]);
      }
    },
  );

  // Europa League fixtures endpoint (League ID 3)
  apiRouter.get(
    "/europa-league/fixtures",
    async (_req: Request, res: Response) => {
      try {
        console.log("Europa League fixtures API call initiated");

        // Europa League ID is 3
        const leagueId = 3;
        // Always use 2025 season data as requested
        const seasonToUse = 2025;

        console.log(
          `Attempting to fetch Europa League (ID: ${leagueId}) fixtures for season ${seasonToUse}`,
        );

        // Use API-Football (RapidAPI) only
        // First, let's verify the league exists
        const leagueData = await rapidApiService.getLeagueById(leagueId);
        if (!leagueData) {
          console.error("Europa League data not found in API");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        console.log(
          `Europa League found in RapidAPI: ${leagueData.league.name}, attempting to fetch fixtures...`,
        );
        console.log(
          `Using fixed season ${seasonToUse} for Europa League fixtures as requested`,
        );

        // Fetch fixtures using the verified season
        const fixtures = await rapidApiService.getFixturesByLeague(
          leagueId,
          seasonToUse,
        );

        console.log(
          `Europa League fixtures response received from RapidAPI, count: ${fixtures ? fixtures.length : 0}`,
        );

        if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
          console.warn("No Europa League fixtures found in API response");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        // Sort fixtures by date (newest first)
        const sortedFixtures = [...fixtures].sort((a, b) => {
          return (
            new Date(b.fixture.date).getTime() -
            new Date(a.fixture.date).getTime()
          );
        });

        console.log(
          `Returning ${sortedFixtures.length} sorted Europa League fixtures from RapidAPI`,
        );
        return res.json(sortedFixtures);
      } catch (error) {
        console.error("Error fetching Europa League fixtures:", error);
        // Return empty array instead of error to avoid breaking frontend
        return res.json([]);
      }
    },
  );

  // Champions League fixtures endpoint (League ID 2)
  apiRouter.get(
    "/champions-league/fixtures",
    async (_req: Request, res: Response) => {
      try {
        console.log("Champions League fixtures API call initiated");

        // Champions League ID is 2
        const leagueId = 2;
        // Use current year for the season
        const currentYear = new Date().getFullYear();

        console.log(
          `Attempting to fetch Champions League (ID: ${leagueId}) fixtures for season ${currentYear}`,
        );

        // First, let's verify the league exists
        const leagueData = await rapidApiService.getLeagueById(leagueId);
        if (!leagueData) {
          console.error("Champions League data not found in API");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        console.log(
          `Champions League found: ${leagueData.league.name}, attempting to fetch fixtures...`,
        );

        // Always use 2025 season data as requested
        const seasonToUse = 2025;

        console.log(
          `Using fixed season ${seasonToUse} for Champions League fixtures as requested`,
        );

        // Fetch fixtures using the verified season
        const fixtures = await rapidApiService.getFixturesByLeague(
          leagueId,
          seasonToUse,
        );

        console.log(
          `Champions League fixtures response received, count: ${fixtures ? fixtures.length : 0}`,
        );

        if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
          console.warn("No Champions League fixtures found in API response");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        // Sort fixtures by date (newest first)
        const sortedFixtures = [...fixtures].sort((a, b) => {
          return (
            new Date(b.fixture.date).getTime() -
            new Date(a.fixture.date).getTime()
          );
        });

        console.log(
          `Returning ${sortedFixtures.length} sorted Champions League fixtures`,
        );
        return res.json(sortedFixtures);
      } catch (error) {
        console.error("Error fetching Champions League fixtures:", error);
        // Return empty array instead of error to avoid breaking frontend
        return res.json([]);
      }
    },
  );

  // Bundesliga fixtures endpoint (League ID 78)
  apiRouter.get(
    "/bundesliga/fixtures",
    async (_req: Request, res: Response) => {
      try {
        console.log("Bundesliga fixtures API call initiated");

        // Bundesliga ID is 78
        const leagueId = 78;
        // Use current year for the season
        const currentYear = new Date().getFullYear();

        console.log(
          `Attempting to fetch Bundesliga (ID: ${leagueId}) fixtures for season ${currentYear}`,
        );

        // First, let's verify the leaguedata exists
        const leagueData = await rapidApiService.getLeagueById(leagueId);
        if (!leagueData) {
          console.error("Bundesliga data not found in API");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        console.log(
          `Bundesliga found: ${leagueData.league.name}, attempting to fetch fixtures...`,
        );

        // Always use 2025 season data as requested
        const seasonToUse = 2025;

        console.log(
          `Using fixed season ${seasonToUse} for Bundesliga fixtures as requested`,
        );

        // Fetch fixtures using the verified season
        const fixtures = await rapidApiService.getFixturesByLeague(
          leagueId,
          seasonToUse,
        );

        console.log(
          `Bundesliga fixtures response received, count: ${fixtures ? fixtures.length : 0}`,
        );

        if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
          console.warn("No Bundesliga fixtures found in API response");
          // Return empty array instead of 404 error to avoid breaking frontend
          return res.json([]);
        }

        // Sort fixtures by date (newest first)
        const sortedFixtures = [...fixtures].sort((a, b) => {
          return (
            new Date(b.fixture.date).getTime() -
            new Date(a.fixture.date).getTime()
          );
        });

        console.log(
          `Returning ${sortedFixtures.length} sorted Bundesliga fixtures`,
        );
        return res.json(sortedFixtures);
      } catch (error) {
        console.error("Error fetching Bundesliga fixtures:", error);
        // Return empty array instead of error to avoid breaking frontend
        return res.json([]);
      }
    },
  );

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
      if (articleData.url && articleData.url.includes("example.com")) {
        // Use our primary domain directly
        articleData.url = articleData.url.replace(
          /https?:\/\/example\.com/i,
          "https://cssport.vip",
        );
      }

      const article = await storage.createNewsArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating news article:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid article data", errors: error.errors });
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
      if (updates.url && updates.url.includes("example.com")) {
        // Use our primary domain directly
        updates.url = updates.url.replace(
          /https?:\/\/example\.com/i,
          "https://cssport.vip",
        );
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
  apiRouter.get(
    "/news/betsapi/sports/:sportId",
    async (req: Request, res: Response) => {
      try {
        const sportId = parseInt(req.params.sportId);
        const page = parseInt(req.query.page as string) || 1;
        const perPage = parseInt(req.query.per_page as string) || 10;

        if (isNaN(sportId)) {
          return res.status(400).json({ message: "Invalid sport ID" });
        }

        // BetsAPI service temporarily disabled
        const formattedArticles: any[] = [];

        res.json(formattedArticles);
      } catch (error) {
        console.error("Error fetching BetsAPI sports news:", error);
        res.status(500).json({
          message: "Failed to fetch sports news from BetsAPI",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  apiRouter.get(
    "/news/betsapi/league/:leagueId",
    async (req: Request, res: Response) => {
      try {
        const leagueId = parseInt(req.params.leagueId);
        const page = parseInt(req.query.page as string) || 1;
        const perPage = parseInt(req.query.per_page as string) || 10;

        if (isNaN(leagueId)) {
          return res.status(400).json({ message: "Invalid league ID" });
        }

        // BetsAPI service temporarily disabled
        const formattedArticles: any[] = [];

        res.json(formattedArticles);
      } catch (error) {
        console.error("Error fetching BetsAPI league news:", error);
        res.status(500).json({
          message: "Failed to fetch league news from BetsAPI",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // SportsRadar flag endpoint (server-side to avoid CORS)
  apiRouter.get(
    "/sportsradar/flags/:country",
    async (req: Request, res: Response) => {
      try {
        const { country } = req.params;
        const sanitizedCountry = country.toLowerCase().replace(/\s+/g, "_");

        // SportsRadar flag URL
        const flagUrl = `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${sanitizedCountry}/flag_24x24.png`;

        // Fetch the flag image
        const response = await fetch(flagUrl, {
          headers: {
            accept: "image/png,image/jpeg,image/svg+xml,image/*",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (response.ok) {
          const contentType =
            response.headers.get("content-type") || "image/png";
          const buffer = await response.arrayBuffer();

          res.set("Content-Type", contentType);
          res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
          res.send(Buffer.from(buffer));
        } else {
          console.warn(`SportsRadar flag not found for country: ${country}`);
          res.status(404).json({ error: "Flag not found" });
        }
      } catch (error) {
        console.error(
          `Error fetching SportsRadar flag for ${req.params.country}:`,
          error,
        );
        res.status(500).json({ error: "Failed to fetch flag" });
      }
    },
  );

  // SportsRadar league logo endpoint (server-side to avoid CORS)
  apiRouter.get(
    "/sportsradar/leagues/:leagueId/logo",
    async (req: Request, res: Response) => {
      try {
        let { leagueId } = req.params;

        // If leagueId contains a URL, extract the actual league ID
        if (leagueId.includes("http")) {
          const urlDecoded = decodeURIComponent(leagueId);
          const leagueIdMatch = urlDecoded.match(/\/leagues\/(\d+)\.png/);
          if (leagueIdMatch && leagueIdMatch[1]) {
            leagueId = leagueIdMatch[1];
          } else {
            console.warn(`Could not extract league ID from URL: ${urlDecoded}`);
            return res.status(400).json({ error: "Invalid league ID format" });
          }
        }

        // Validate that leagueId is numeric
        if (!/^\d+$/.test(leagueId)) {
          console.warn(`Invalid league ID format: ${leagueId}`);
          return res.status(400).json({ error: "League ID must be numeric" });
        }

        console.log(`SportsRadar: Fetching logo for league ID: ${leagueId}`);

        // Try multiple SportsRadar logo formats for leagues
        const logoUrls = [
          `https://api.sportradar.com/soccer/production/v4/en/tournaments/${leagueId}/logo.png`,
          `https://api.sportradar.com/soccer-images/production/tournaments/${leagueId}/logo.png`,
          `https://imagecache.sportradar.com/production/soccer/tournaments/${leagueId}/logo.png`,
        ];

        for (const logoUrl of logoUrls) {
          try {
            const response = await fetch(logoUrl, {
              headers: {
                accept: "image/png,image/jpeg,image/svg+xml,image/*",
                "user-agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (response.ok) {
              const contentType =
                response.headers.get("content-type") || "image/png";
              const buffer = await response.arrayBuffer();

              res.set("Content-Type", contentType);
              res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
              res.send(Buffer.from(buffer));
              return;
            }
          } catch (error) {
            console.warn(
              `SportsRadar league logo URL failed: ${logoUrl}`,
              error,
            );
            continue;
          }
        }

        console.warn(
          `SportsRadar league logo not found for league: ${leagueId}`,
        );
        res.status(404).json({ error: "League logo not found" });
      } catch (error) {
        console.error(
          `Error fetching SportsRadar league logo for ${req.params.leagueId}:`,
          error,
        );
        res.status(500).json({ error: "Failed to fetch league logo" });
      }
    },
  );

  // New endpoint for 365scores league logos
  apiRouter.get(
    "/365scores/leagues/:leagueId/logo",
    async (req: Request, res: Response) => {
      try {
        let { leagueId } = req.params;

        // If leagueId contains a URL, extract the actual league ID
        if (leagueId.includes("http")) {
          const urlDecoded = decodeURIComponent(leagueId);
          const leagueIdMatch = urlDecoded.match(/\/leagues\/(\d+)\.png/);
          if (leagueIdMatch && leagueIdMatch[1]) {
            leagueId = leagueIdMatch[1];
          } else {
            console.warn(`Could not extract league ID from URL: ${urlDecoded}`);
            return res.status(400).json({ error: "Invalid league ID format" });
          }
        }

        // Validate that leagueId is numeric
        if (!/^\d+$/.test(leagueId)) {
          console.warn(`Invalid league ID format: ${leagueId}`);
          return res.status(400).json({ error: "League ID must be numeric" });
        }

        console.log(`365scores: Fetching logo for league ID: ${leagueId}`);

        // Try multiple 365scores logo formats for leagues
        const logoUrls = [
          `https://www.365scores.com/images/leagues/${leagueId}.png`,
          `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitions:default1.png/v12/Competitions/${leagueId}`,
          `https://365scores.com/images/competitions/${leagueId}.png`,

          `https://static.365scores.com/images/leagues/${leagueId}.png`,
        ];

        for (const logoUrl of logoUrls) {
          try {
            const response = await fetch(logoUrl, {
              headers: {
                accept: "image/png,image/jpeg,image/svg+xml,image/*",
                "user-agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (response.ok) {
              const contentType =
                response.headers.get("content-type") || "image/png";
              const buffer = await response.arrayBuffer();

              res.set("Content-Type", contentType);
              res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
              res.send(Buffer.from(buffer));
              return;
            }
          } catch (error) {
            console.warn(`365scores league logo URL failed: ${logoUrl}`, error);
            continue;
          }
        }

        console.warn(`365scores league logo not found for league: ${leagueId}`);
        res.status(404).json({ error: "League logo not found" });
      } catch (error) {
        console.error(
          `Error fetching 365scores league logo for ${req.params.leagueId}:`,
          error,
        );
        res.status(500).json({ error: "Failed to fetch league logo" });
      }
    },
  );

  // New endpoint for shot data (fixtures/players)
  apiRouter.get(
    "/fixtures/:fixtureId/shots",
    async (req: Request, res: Response) => {
      try {
        const { fixtureId } = req.params;

        const response = await rapidApiService.get('/fixtures/players', {
          params: { fixture: fixtureId }
        });

        // Extract shot data from player statistics
        const shots: any[] = [];

        response.data.response.forEach((team: any) => {
          team.players?.forEach((playerData: any) => {
            const player = playerData.player;
            const statistics = playerData.statistics[0]; // First statistics object

            // Check if player has shot data
            if (statistics.shots && statistics.shots.total > 0) {
              // For each shot (you'd need more detailed shot data from API)
              for (let i = 0; i < statistics.shots.total; i++) {
                shots.push({
                  id: `${player.id}-${i}`,
                  x: Math.random() * 40 + (team.team.id === 'home' ? 60 : 20), // Placeholder - need real coordinates
                  y: Math.random() * 60 + 20,
                  type: statistics.goals.total > 0 ? 'goal' : 'shot',
                  player: {
                    id: player.id,
                    name: player.name,
                    photo: player.photo
                  },
                  team: team.team,
                  minute: Math.floor(Math.random() * 90), // Placeholder
                  bodyPart: 'Right foot', // Placeholder
                  situation: 'Regular Play', // Placeholder
                  xG: Math.random() * 0.8 + 0.05,
                  onTarget: statistics.shots.on || 0
                });
              }
            }
          });
        });

        res.json(shots);
      } catch (error) {
        console.error('Error fetching shot data:', error);
        res.status(500).json({ error: 'Failed to fetch shot data' });
      }
    }
  );

  // New endpoint for square team logos
  apiRouter.get(
    "/team-logo/square/:teamId",
    async (req: Request, res: Response) => {
      try {
        const { teamId } = req.params;
        const size = parseInt(req.query.size as string) || 72; // Default 72x72 pixels

        console.log(
          `Fetching and resizing team logo for ID: ${teamId} to ${size}x${size}`,
        );

        // Validate teamId
        if (!/^\d+$/.test(teamId)) {
          return res.status(400).json({ error: "Invalid team ID format" });
        }

        // Try multiple logo sources
        const logoUrls = [
          `https://media.api-sports.io/football/teams/${teamId}.png`,
          `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${teamId}`,
          `https://api.sportradar.com/soccer-images/production/competitors/${teamId}/logo.png`,
        ];

        let imageBuffer = null;
        let sourceUrl = "";

                // Try each logo source
        for (const logoUrl of logoUrls) {
          try {
            const response = await fetch(logoUrl, {
              headers: {
                accept: "image/png,image/jpeg,image/svg+xml,image/*",
                "user-agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
              sourceUrl = logoUrl;
              console.log(`Successfully fetched logo from: ${logoUrl}`);
              break;
            }
          } catch (error) {
            console.warn(
              `Failed to fetch from ${logoUrl}:`,
              error instanceof Error ? error.message : "Unknown error",
            );
            continue;
          }
        }

        // If no image found, return fallback
        if (!imageBuffer) {
          return res
            .status(404)
            .json({ error: "Logo not found from any source" });
        }

        // Resize image to square dimensions using Sharp
        const resizedBuffer = await sharp(imageBuffer)
          .resize(size, size, {
            fit: "cover", // This will crop the image to fill the square
            position: "center",
          })
          .png()
          .toBuffer();

        // Set appropriate headers
        res.set({
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
          "X-Source-URL": sourceUrl,
        });

        res.send(resizedBuffer);
      } catch (error) {
        console.error("Error processing square team logo:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // SportsRadar team logo endpoint (server-side to avoid CORS)
  apiRouter.get(
    "/sportsradar/teams/:teamId/logo",
    async (req: Request, res: Response) => {
      try {
        let { teamId } = req.params;

        // If teamId contains a URL, extract the actual team ID
        if (teamId.includes("http")) {
          const urlDecoded = decodeURIComponent(teamId);
          const teamIdMatch = urlDecoded.match(/\/teams\/(\d+)\.png/);
          if (teamIdMatch && teamIdMatch[1]) {
            teamId = teamIdMatch[1];
          } else {
            console.warn(`Could not extract team ID from URL: ${urlDecoded}`);
            return res.status(400).json({ error: "Invalid team ID format" });
          }
        }

        // Validate that teamId is numeric
        if (!/^\d+$/.test(teamId)) {
          console.warn(`Invalid team ID format: ${teamId}`);
          return res.status(400).json({ error: "Team ID must be numeric" });
        }

        console.log(`SportsRadar: Fetching logo for team ID: ${teamId}`);

        // Try multiple SportsRadar logo formats
        const logoUrls = [
          `https://api.sportradar.com/soccer/production/v4/en/competitors/${teamId}/profile.png`,
          `https://api.sportradar.com/soccer-images/production/competitors/${teamId}/logo.png`,
          `https://imagecache.sportradar.com/production/soccer/competitors/${teamId}/logo.png`,
        ];

        for (const logoUrl of logoUrls) {
          try {
            const response = await fetch(logoUrl, {
              headers: {
                accept: "image/png,image/jpeg,image/svg+xml,image/*",
                "user-agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (response.ok) {
              const contentType =
                response.headers.get("content-type") || "image/png";
              const buffer = await response.arrayBuffer();

              res.set("Content-Type", contentType);
              res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
              res.send(Buffer.from(buffer));
              return;
            }
          } catch (error) {
            console.warn(`SportsRadar logo URL failed: ${logoUrl}`, error);
            continue;
          }
        }

        console.warn(`SportsRadar team logo not found for team: ${teamId}`);
        res.status(404).json({ error: "Team logo not found" });
      } catch (error) {
        console.error(
          `Error fetching SportsRadar team logo for ${req.params.teamId}:`,
          error,
        );
        res.status(500).json({ error: "Failed to fetch team logo" });
      }
    },
  );

  // Get fixtures by country and season
  apiRouter.get(
    "/fixtures/country/:country",
    async (req: Request, res: Response) => {
      try {
        const { country } = req.params;
        const { season, league } = req.query;

        console.log(
          `API: Getting fixtures for country: ${country}, season: ${season}, league: ${league}`,
        );

        // Get all available leagues first
        const allLeagues = await rapidApiService.getLeagues();

        // Filter leagues by country
        const countryLeagues = allLeagues.filter((leagueResponse) => {
          const leagueCountry =
            leagueResponse.country?.name?.toLowerCase() || "";
          return leagueCountry.includes(country.toLowerCase());
        });

        console.log(
          `Found ${countryLeagues.length} leagues for country: ${country}`,
        );

        let allFixtures: any[] = [];

        // Fetch fixtures for each league in the country
        for (const leagueResponse of countryLeagues.slice(0, 10)) {
          // Limit to top 10 leagues to avoid timeout
          try {
            const leagueId = leagueResponse.league.id;
            const seasonYear = season ? parseInt(season as string) : 2024;

            const leagueFixtures = await rapidApiService.getFixturesByLeague(
              leagueId,
              seasonYear,
            );

            // Filter by specific league if requested
            if (
              league &&
              !leagueResponse.league.name
                .toLowerCase()
                .includes((league as string).toLowerCase())
            ) {
              continue;
            }

            allFixtures = [...allFixtures, ...leagueFixtures];

            console.log(
              `Added ${leagueFixtures.length} fixtures from ${leagueResponse.league.name}`,
            );
          } catch (error) {
            console.error(
              `Error fetching fixtures for league ${leagueResponse.league.id}:`,
              error,
            );
            continue;
          }
        }

        // Sort by date
        allFixtures.sort(
          (a, b) =>
            new Date(a.fixture.date).getTime() -
            new Date(b.fixture.date).getTime(),
        );

        console.log(`Total fixtures for ${country}: ${allFixtures.length}`);

        // Server-side: Keep all fixtures - let client do precise date filtering
        // This ensures we capture fixtures from all timezones that might be valid
        const validatedFixtures = allFixtures.filter((fixture) => {
          try {
            const apiDateString = fixture.fixture.date;
            const extractedDate = apiDateString.split("T")[0];

            // Allow fixtures from ±1 day to capture all timezone variations
            const today = new Date();
            const targetDateObj = new Date(today);
            const previousDay = new Date(targetDateObj);
            previousDay.setDate(previousDay.getDate() - 1);
            const nextDay = new Date(targetDateObj);
            nextDay.setDate(nextDay.getDate() + 1);

            const validDates = [
              previousDay.toISOString().split("T")[0],
              today.toISOString().split("T")[0],
              nextDay.toISOString().split("T")[0],
            ];

            if (!validDates.includes(extractedDate)) {
              console.log(`🚫 [Routes] Final validation - rejecting fixture outside date range: {
  requestedDate: '${today.toISOString().split("T")[0]}',
  apiReturnedDate: '${apiDateString}',
  extractedDate: '${extractedDate}',
  fixtureId: ${fixture.fixture.id}'
}`);
              return false;
            }

            return true;
          } catch (error) {
            console.error("Error in final date validation:", error);
            return false;
          }
        });

        res.json({
          success: true,
          fixtures: validatedFixtures,
          country: country,
          season: season || 2024,
          totalLeagues: countryLeagues.length,
          totalFixtures: validatedFixtures.length,
        });
      } catch (error) {
        console.error("Error fetching fixtures by country:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch fixtures by country",
        });
      }
    },
  );

  // Debug endpoint to compare fixture data between RapidAPI and SportsRadar
  apiRouter.get(
    "/debug/fixture/:fixtureId/compare",
    async (req: Request, res: Response) => {
      try {
        const { fixtureId } = req.params;

        console.log(`🔍 [DEBUG] Comparing fixture ${fixtureId} between APIs`);

        // Add debugging for H2H route conflicts
        if (!fixtureId || fixtureId.trim() === "") {
          console.log(`❌ [DEBUG] Invalid fixture ID in compare route: "${fixtureId}"`);
          return res.status(400).json({
            error: "Invalid fixture ID",
            fixtureId: fixtureId,
          });
        }

        // Fetch from RapidAPI (our current source)
        let rapidApiData = null;
        let rapidApiError = null;
        try {
          const rapidApiKey = process.env.RAPID_API_KEY;
          if (!rapidApiKey) {
            rapidApiError = "RapidAPI key not configured";
          } else {
            const response = await fetch(
              `https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixtureId}`,
              {
                headers: {
                  "X-RapidAPI-Key": rapidApiKey,
                  "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
                },
              },
            );

            if (response.ok) {
              const apiResponse = await response.json();
              if (apiResponse.response && apiResponse.response.length > 0) {
                rapidApiData = apiResponse.response[0];
              } else {
                rapidApiError = "No fixture found in RapidAPI response";
              }
            } else {
              rapidApiError = `RapidAPI responded with status ${response.status}`;
            }
          }
        } catch (error) {
          rapidApiError =
            error instanceof Error ? error.message : "Unknown RapidAPI error";
          console.error(
            `Error fetching from RapidAPI for fixture ${fixtureId}:`,
            error,
          );
        }

        // Fetch from SportsRadar API
        let sportsRadarData = null;
        let sportsRadarError = null;
        try {
          const sportsRadarKey =
            process.env.SPORTSRADAR_API_KEY ||
            "GyxLqseloLhoo4ietUKotcYT89QjqHuYS6xDNAyY";

          // Try to find the fixture in SportsRadar by searching live matches first
          const liveResponse = await fetch(
            `https://api.sportradar.com/soccer/trial/v4/en/matches/live.json?api_key=${sportsRadarKey}`,
          );

          if (liveResponse.ok) {
            const liveData = await liveResponse.json();

            // Look for the match by team names if we have RapidAPI data
            if (rapidApiData) {
              const rapidHomeTeam = rapidApiData.teams?.home?.name || "";
              const rapidAwayTeam = rapidApiData.teams?.away?.name || "";

              const sportsRadarMatch = liveData.matches?.find((match: any) => {
                const homeTeam = match.home_team?.name || "";
                const awayTeam = match.away_score; // Assuming away_score is the away team name for comparison
                return (
                  (homeTeam.includes(rapidHomeTeam.split(" ")[0]) &&
                    awayTeam.includes(rapidAwayTeam.split(" ")[0])) ||
                  (homeTeam.includes(rapidAwayTeam.split(" ")[0]) &&
                    awayTeam.includes(rapidHomeTeam.split(" ")[0]))
                );
              });

              if (sportsRadarMatch) {
                sportsRadarData = sportsRadarMatch;
              } else {
                sportsRadarError =
                  "Matching fixture not found in SportsRadar live data";
              }
            } else {
              sportsRadarError =
                "Cannot search SportsRadar without RapidAPI data for comparison";
            }
          } else {
            sportsRadarError = `SportsRadar API responded with status ${liveResponse.status}`;
          }
        } catch (error) {
          sportsRadarError =
            error instanceof Error
              ? error.message
              : "Unknown SportsRadar error";
          console.error(`Error fetching from SportsRadar:`, error);
        }

        // Build comparison response
        const comparison = {
          fixtureId,
          serverTime: new Date().toISOString(),
          rapidApi: {
            available: !!rapidApiData,
            error: rapidApiError,
            data:
              rapidApiData
              ? {
                  status: rapidApiData.fixture?.status?.short,
                  statusLong: rapidApiData.fixture?.status?.long,
                  homeTeam: rapidApiData.teams?.home?.name,
                  awayTeam: rapidApiData.teams?.away?.name,
                  homeGoals: rapidApiData.goals?.home,
                  awayGoals: rapidApiData.goals?.away,
                  date: rapidApiData.fixture?.date,
                  elapsed: rapidApiData.fixture?.status?.elapsed,
                  league: rapidApiData.league?.name,
                }
              : null,
          },
          sportsRadar: {
            available: !!sportsRadarData,
            error: sportsRadarError,
            data:
              sportsRadarData
              ? {
                  status: sportsRadarData.status,
                  homeTeam: sportsRadarData.home_team?.name,
                  awayTeam: sportsRadarData.away_score,
                  date: sportsRadarData.scheduled,
                  elapsed: sportsRadarData.clock?.minute,
                  league: sportsRadarData.tournament?.name,
                }
              : null,
          },
          differences: [] as any[],
          recommendation: "",
        };

        // Compare key fields if both APIs have data
        if (rapidApiData && sportsRadarData) {
          const rapidHomeGoals = rapidApiData.goals?.home;
          const rapidAwayGoals = rapidApiData.goals?.away;
          const rapidElapsed = rapidApiData.fixture?.status?.elapsed;

          const sportsRadarHomeGoals = sportsRadarData.home_score;
          const sportsRadarAwayGoals = sportsRadarData.away_score;
          const sportsRadarElapsed = sportsRadarData.clock?.minute;

          if (rapidHomeGoals !== sportsRadarHomeGoals) {
            comparison.differences.push({
              field: "home_goals",
              rapidApi: rapidHomeGoals,
              sportsRadar: sportsRadarHomeGoals,
            });
          }

          if (rapidAwayGoals !== sportsRadarAwayGoals) {
            comparison.differences.push({
              field: "away_goals",
              rapidApi: rapidAwayGoals,
              sportsRadar: sportsRadarAwayGoals,
            });
          }

          if (rapidElapsed !== sportsRadarElapsed) {
            comparison.differences.push({
              field: "elapsed_time",
              rapidApi: rapidElapsed,
              sportsRadar: sportsRadarElapsed,
            });
          }

          comparison.recommendation =
            comparison.differences.length > 0
              ? "Data differs between APIs - consider cross-referencing"
              : "Data is consistent between both APIs";
        } else if (rapidApiError && sportsRadarError) {
          comparison.recommendation =
            "Both APIs failed - check API configurations";
        } else if (rapidApiError) {
          comparison.recommendation =
            "RapidAPI failed - using SportsRadar data if available";
        } else if (sportsRadarError) {
          comparison.recommendation =
            "SportsRadar data not available - using RapidAPI data";
        } else {
          comparison.recommendation = "No data available from either API";
        }

        res.json(comparison);
      } catch (error) {
        console.error("Debug fixture comparison error:", error);
        res.status(500).json({
          error: "Comparison test failed",
          details: error instanceof Error ? error.message : "Unknown error",
          fixtureId: req.params.fixtureId,
        });
      }
    },
  );

  // Debug endpoint to check specific fixture freshness
  apiRouter.get(
    "/debug/fixture/:fixtureId",
    async (req: Request, res: Response) => {
      try {
        const { fixtureId } = req.params;

        console.log(`🔍 [DEBUG] Checking fixture ${fixtureId} freshness`);

        if (!fixtureId || fixtureId.trim() === "") {
          return res.status(400).json({
            error: "Invalid fixture ID",
            fixtureId: fixtureId,
          });
        }

        // Check cached version
        let cacheInfo = null;
        try {
          const cachedFixture = await storage.getCachedFixture(fixtureId);

          if (cachedFixture) {
            const cacheAge =
              Date.now() - new Date(cachedFixture.timestamp).getTime();
            cacheInfo = {
              exists: true,
              age: Math.round(cacheAge / 60000), // in minutes
              lastUpdated: cachedFixture.timestamp,
              data: cachedFixture.data,
            };
          } else {
            cacheInfo = {
              exists: false,
              message: "No cached data found",
            };
          }
        } catch (cacheError) {
          console.error(
            `Error checking cache for fixture ${fixtureId}:`,
            cacheError,
          );
          cacheInfo = {
            exists: false,
            error:
              cacheError instanceof Error ? cacheError.message : "Cache error",
          };
        }

        // Fetch fresh data from API
        let freshData = null;
        let apiError = null;
        try {
          const response = await fetch(
            `https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixtureId}`,
            {
              headers: {
                "X-RapidAPI-Key": process.env.RAPID_API_KEY || "",
                "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
              },
            },
          );

          const apiResponse = await response.json();
          if (apiResponse.response && apiResponse.response.length > 0) {
            freshData = apiResponse.response[0];
          } else {
            apiError = "No fixture found in API response";
          }
        } catch (error) {
          console.error(
            `Error fetching fresh data for fixture ${fixtureId}:`,
            error,
          );
          apiError = error instanceof Error ? error.message : "API fetch error";
        }

        // Compare data
        const comparison: {
          fixtureId: any;
          serverTime: string;
          cache: any;
          fresh: any;
          apiError: any;
          isOutdated: boolean;
          differences: any[];
        } = {
          fixtureId,
          serverTime: new Date().toISOString(),
          cache: cacheInfo,
          fresh: freshData,
          apiError: apiError,
          isOutdated: false,
          differences: [],
        };

        if (cacheInfo?.exists && freshData) {
          // Compare key fields safely
          const fieldsToCompare = [
            "fixture.status.short",
            "fixture.status.long",
            "goals.home",
            "goals.away",
            "score.halftime.home",
            "score.halftime.away",
            "score.fulltime.home",
            "score.fulltime.away",
          ];

          for (const field of fieldsToCompare) {
            try {
              const cachedValue = field
                .split(".")
                .reduce((obj: any, key: string) => {
                  return obj && typeof obj === "object" ? obj[key] : undefined;
                }, cacheInfo.data);

              const freshValue = field
                .split(".")
                .reduce((obj: any, key: string) => {
                  return obj && typeof obj === "object" ? obj[key] : undefined;
                }, freshData);

              // Safe comparison - convert to strings to avoid type issues
              const cachedStr =
                cachedValue !== null && cachedValue !== undefined
                  ? String(cachedValue)
                  : "null";
              const freshStr =
                freshValue !== null && freshValue !== undefined
                  ? String(freshValue)
                  : "null";

              if (cachedStr !== freshStr) {
                comparison.differences.push({
                  field,
                  cached: cachedValue,
                  fresh: freshValue,
                });
                comparison.isOutdated = true;
              }
            } catch (error) {
              console.error(`Error comparing field ${field}:`, error);
              comparison.differences.push({
                field,
                cached: "ERROR",
                fresh: "ERROR",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }
        }

        console.log(
          `✅ [DEBUG] Successfully processed fixture ${fixtureId} debug request`,
        );
        res.json(comparison);
      } catch (error) {
        console.error(
          `❌ [DEBUG] Error in debug fixture endpoint for ${req.params.fixtureId}:`,
          error,
        );
        res.status(500).json({
          error: "Debug test failed",
          details: error instanceof Error ? error.message : "Unknown error",
          fixtureId: req.params.fixtureId,
        });
      }
    },
  );

  // Debug endpoint to test RapidAPI date requests directly
  apiRouter.get(
    "/debug/rapidapi-date/:date",
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;

        console.log(
          `🔬 [DEBUG] Testing RapidAPI direct call for date: ${date}`,
        );

        // Make direct API call with different timezone parameters
        const tests = [
          { timezone: "UTC", name: "UTC" },
          { timezone: "Europe/London", name: "London" },
          { timezone: "America/New_York", name: "New_York" },
          { name: "No_Timezone" }, // No timezone parameter
        ];

        const results = [];

        for (const test of tests) {
          try {
            const params: any = { date };
            if (test.timezone) {
              params.timezone = test.timezone;
            }

            console.log(`🧪 [DEBUG] Testing with params:`, params);

            const response = await fetch(
              `https://api-football-v1.p.rapidapi.com/v3/fixtures?${new URLSearchParams(params)}`,
              {
                headers: {
                  "X-RapidAPI-Key": process.env.RAPID_API_KEY || "",
                  "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
                },
              },
            );

            const data = await response.json();

            if (data.response?.length > 0) {
              const sampleDates = data.response.slice(0, 5).map((f: any) => {
                const fixtureDate = new Date(f.fixture?.date);
                return {
                  id: f.fixture?.id,
                  returnedDate: f.fixture?.date,
                  extractedDate: fixtureDate.toISOString().split("T")[0],
                  matchesRequested:
                    fixtureDate.toISOString().split("T")[0] === date,
                };
              });

              results.push({
                testName: test.name,
                timezone: test.timezone || "none",
                totalResults: data.response.length,
                sampleDates,
                correctDateCount: data.response.filter((f: any) => {
                  const fixtureDate = new Date(f.fixture?.date);
                  return fixtureDate.toISOString().split("T")[0] === date;
                }).length,
              });
            } else {
              results.push({
                testName: test.name,
                timezone: test.timezone || "none",
                totalResults: 0,
                error: "No fixtures returned",
              });
            }
          } catch (error) {
            results.push({
              testName: test.name,
              timezone: test.timezone || "none",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        res.json({
          requestedDate: date,
          serverTime: new Date().toISOString(),
          serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          testResults: results,
        });
      } catch (error) {
        console.error("Debug endpoint error:", error);
        res.status(500).json({ error: "Debug test failed" });
      }
    },
  );

  // Get fixtures by date
  apiRouter.get("/fixtures/date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const { all } = req.query;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      // Get fixtures for the requested date without timezone restrictions
      // This allows us to capture fixtures from all timezones for the given date
      const apiFromDate = date; // Use the date as-is
      const apiToDate = date; // Same day

      const fixtures = await rapidApiService.getFixturesByDate(
        date,
        all === "true",
      );
      console.log(
        `Got ${fixtures.length} fixtures ${all === "true" ? "from all leagues" : "from popular leagues"} for date ${date}`,
      );
      res.json(fixtures);
    } catch (error) {
      console.error("Error fetching fixtures by date:", error);
      res.status(500).json({ error: "Failed to fetch fixtures" });
    }
  });

  // Sportsradar API routes
  apiRouter.get(
    "/sportsradar/fixtures/:id/events",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        console.log(`📊 [Sportsradar] Fetching events for fixture: ${id}`);

        // Return empty events array since Sportsradar events API is not accessible
        res.json({
          success: true,
          events: [],
          message: "Sportsradar events API not accessible",
        });
      } catch (error) {
        console.error("❌ [Sportsradar] Error fetching events:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch Sportsradar events",
          events: [],
        });
      }
    },
  );

  apiRouter.get(
    "/sportsradar/fixtures/:id/stats",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        console.log(`📊 [Sportsradar] Fetching stats for fixture: ${id}`);

        // Return empty stats since Sportsradar stats API is not accessible
        res.json({
          success: true,
          statistics: null,
          message: "Sportsradar stats API not accessible",
        });
      } catch (error) {
        console.error("❌ [Sportsradar] Error fetching stats:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch Sportsradar stats",
          statistics: null,
        });
      }
    },
  );

  // SoccersAPI routes for live action data
  apiRouter.get("/soccersapi/leagues", async (req: Request, res: Response) => {
    try {
      console.log("🏈 [SoccersAPI] Fetching leagues");
      const leagues = await soccersApi.getLeagues();

res.json({
        success: true,
        data: leagues,
        count: leagues.length,
      });
    } catch (error) {
      console.error("❌ [SoccersAPI] Error fetching leagues:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch SoccersAPI leagues",
        data: [],
      });
    }
  });

  apiRouter.get("/soccersapi/live", async (req: Request, res: Response) => {
    try {
      console.log("🔴 [SoccersAPI] Fetching live matches");
      const liveMatches = await soccersApi.getLiveMatches();
      res.json({
        success: true,
        data: liveMatches,
        count: liveMatches.length,
      });
    } catch (error) {
      console.error("❌ [SoccersAPI] Error fetching live matches:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch SoccersAPI live matches",
        data: [],
      });
    }
  });

  apiRouter.get(
    "/soccersapi/matches/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        console.log(`📋 [SoccersAPI] Fetching match details for: ${id}`);

        const matchDetails = await soccersApi.getMatchDetails(id);

        if (matchDetails) {
          res.json({
            success: true,
            data: matchDetails,
          });
        } else {
          res.status(404).json({
            success: false,
            error: "Match not found",
          });
        }
      } catch (
error) {
        console.error("❌ [SoccersAPI] Error fetching match details:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch SoccersAPI match details",
        });
      }
    },
  );

  apiRouter.get(
    "/soccersapi/matches/:id/events",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        console.log(`⚽ [SoccersAPI] Fetching events for match: ${id}`);

        const events = await soccersApi.getMatchEvents(id);
        res.json({
          success: true,
          events: events,
          count: events.length,
        });
      } catch (error) {
        console.error("❌ [SoccersAPI] Error fetching match events:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch SoccersAPI match events",
          events: [],
        });
      }
    },
  );

  apiRouter.get(
    "/soccersapi/matches/:id/stats",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        console.log(`📊 [SoccersAPI] Fetching statistics for match: ${id}`);

        const stats = await soccersApi.getMatchStatistics(id);
        res.json({
          success: true,
          statistics: stats,
        });
      } catch (error) {
        console.error(
          "❌ [SoccersAPI] Error fetching match statistics:",
          error,
        );
        res.status(500).json({
          success: false,
          error: "Failed to fetch SoccersAPI match statistics",
          statistics: null,
        });
      }
    },
  );

  apiRouter.get(
    "/soccersapi/matches/:id/lineups",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        console.log(`👥 [SoccersAPI] Fetching lineups for match: ${id}`);
        const lineups = await soccersApi.getMatchLineups(id);
        res.json({
          success: true,
          lineups: lineups,
        });
      } catch (error) {
        console.error("❌ [SoccersAPI] Error fetching match lineups:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch SoccersAPI match lineups",
          lineups: null,
        });
      }
    },
  );

  // Get live fixtures (with B365API fallback)
  apiRouter.get("/fixtures/live", async (_req: Request, res: Response) => {
    try {
      // Use API-Football (RapidAPI) only
      try {
        const fixtures = await rapidApiService.getLiveFixtures();
        console.log(`Retrieved ${fixtures.length} live fixtures from RapidAPI`);

        // NO CACHING for live fixtures - they need real-time updates
        console.log(
          `🔴 [LIVE API] Returning ${fixtures.length} fresh live fixtures (bypassing cache)`,
        );

        // Set a flag on each fixture to indicate it's from live endpoint
        fixtures.forEach(fixture => {
          fixture.isLiveData = true;
          fixture.lastUpdated = Date.now();
        });

        // Only cache ended matches from the live response
        const endedMatches = fixtures.filter((fixture) =>
          ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC"].includes(
            fixture.fixture.status.short,
          ),
        );

        if (endedMatches.length > 0) {
          console.log(
            `💾 [LIVE API] Caching ${endedMatches.length} ended matches from live response`,
          );
          for (const fixture of endedMatches) {
            try {
              const fixtureId = fixture.fixture.id.toString();
              const existingFixture = await storage.getCachedFixture(fixtureId);

              if (existingFixture) {
                await storage.updateCachedFixture(fixtureId, fixture);
              } else {
                await storage.createCachedFixture({
                  fixtureId: fixtureId,
                  date: new Date().toISOString().split("T")[0],
                  league: fixture.league.id.toString(),
                  data: fixture,
                });
              }
            } catch (cacheError) {
              console.error(
                `Error caching ended fixture ${fixture.fixture.id}:`,
                cacheError,
              );
            }
          }
        }

        return res.json(fixtures);
      } catch (rapidApiError) {
        console.error("RapidAPI error for live fixtures:", rapidApiError);

        // If API fails, return empty array for live fixtures - no stale cache for live matches
        console.log(
          `❌ [LIVE API] RapidAPI failed for live fixtures - returning empty array (no stale cache for live data)`,
        );
        return res.json([]);
      }
    } catch (error) {
      console.error("Error fetching live fixtures:", error);
      res.status(500).json({ message: "Failed to fetch live fixtures" });
    }
  });

  // Get country flag with SportsRadar fallback
  apiRouter.get("/flags/:country", async (req: Request, res: Response) => {
    try {
      const { country } = req.params;

      if (!country) {
        return res.status(400).json({
          success: false,
          error: "Country parameter is required",
          fallbackUrl: "/assets/fallback-logo.svg",
          shouldExclude: true,
        });
      }

      console.log(`Getting flag for country: ${country}`);

      // If SportsRadar fails, try 365scores CDN
      console.warn(`🚫 Country ${country} will use fallback flag`);
      res.json({
        success: false,
        message: "Flag not found in SportsRadar - using fallback",
        fallbackUrl: "/assets/fallback-logo.svg",
        shouldExclude: false,
      });
    } catch (error) {
      console.error("Error fetching flag:", error);
      res.status(200).json({
        // Return 200 to avoid network errors
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch flag",
        fallbackUrl: "/assets/fallback-logo.svg",
        shouldExclude: false,
      });
    }
  });

  // Get available countries and their seasons
  apiRouter.get("/countries", async (req: Request, res: Response) => {
    try {
      console.log("API: Getting available countries and seasons");

      const allLeagues = await rapidApiService.getLeagues();

      // Group leagues by country and extract season information
      const countriesMap = new Map();

      allLeagues.forEach((leagueResponse) => {
        const countryName = leagueResponse.country?.name || "Unknown";
        const countryCode = leagueResponse.country?.code || "";
        const countryFlag = leagueResponse.country?.flag || "";

        if (!countriesMap.has(countryName)) {
          countriesMap.set(countryName, {
            name: countryName,
            code: countryCode,
            flag: countryFlag,
            leagues: [],
            seasons: new Set(),
          });
        }

        const countryData = countriesMap.get(countryName);
        countryData.leagues.push({
          id: leagueResponse.league.id,
          name: leagueResponse.league.name,
          type: leagueResponse.league.type,
          logo: leagueResponse.league.logo,
        });

        // Add available seasons for this league
        if (leagueResponse.seasons) {
          leagueResponse.seasons.forEach((season) => {
            countryData.seasons.add(season.year);
          });
        }
      });

      // Convert to array and sort
      const countries = Array.from(countriesMap.values())
        .map((country) => ({
          ...country,
          seasons: Array.from(country.seasons).sort(
            (a: any, b: any) => (b as number) - (a as number),
          ), // Sort seasons descending
          leagueCount: country.leagues.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Found ${countries.length} countries with leagues`);

      res.json({
        success: true,
        countries: countries,
        totalCountries: countries.length,
        totalLeagues: allLeagues.length,
      });
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch countries",
      });
    }
  });

  // Removing UEFA U21 routes registration as requested

  // API endpoint to fetch match events
  apiRouter.get("/fixtures/:id/events", async (req: Request, res: Response) => {
    try {
      const fixtureId = parseInt(req.params.id);
      if (isNaN(fixtureId)) {
        return res.status(400).json({ error: "Invalid fixture ID" });
      }

      const events = await rapidApiService.getFixtureEvents(fixtureId);

      if (!events) {
        return res.status(404).json({ error: "Events not found" });
      }

      console.log(
        `📊 [Events API] Fetched ${events?.length || 0} events for fixture ${fixtureId}`,
      );

      res.json(events || []);
    } catch (error) {
      console.error("❌ Error fetching fixture events:", error);
      res.status(500).json({ error: "Failed to fetch fixture events" });
    }
  });

  // Get enhanced commentary for a fixture
  apiRouter.get('/fixtures/:id/commentary', async (req, res) => {
    try {
      const fixtureId = parseInt(req.params.id);
      const homeTeam = req.query.homeTeam as string;
      const awayTeam = req.query.awayTeam as string;

      console.log(`📝 [Commentary API] Generating enhanced commentary for fixture: ${fixtureId}`);

      const events = await rapidApiService.getFixtureEvents(fixtureId);

      if (events && homeTeam && awayTeam) {
        const { EnhancedCommentaryService } = await import('./services/enhancedCommentary');
        const commentary = EnhancedCommentaryService.generateEnhancedCommentary(
          events,
          homeTeam,
          awayTeam
        );

        console.log(`📝 [Commentary API] Generated ${commentary.length} commentary entries`);
        res.json(commentary);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error(`❌ [Commentary API] Error generating commentary:`, error);
      res.status(500).json({ error: 'Failed to generate commentary' });
    }
  });

   // Get fixture statistics (including player statistics)
  apiRouter.get('/fixtures/:id/players', async (req: Request, res: Response) => {
    try {
      const fixtureId = parseInt(req.params.id);

      console.log(`👥 [Players API] Fetching player statistics for fixture ${fixtureId}`);

      const playerStats = await rapidApiService.getFixturePlayerStatistics(fixtureId);

      if (playerStats) {
        console.log(`👥 [Players API] Fetched ${playerStats.length} team(s) with player statistics for fixture ${fixtureId}`);
        res.json(playerStats);
      } else {
        console.log(`👥 [Players API] No player statistics found for fixture ${fixtureId}`);
        res.status(404).json({ error: "Player statistics not found" });
      }
    } catch (error) {
      console.error(`❌ [Players API] Error fetching player statistics:`, error);
      res.status(500).json({ error: "Failed to fetch player statistics" });
    }
  });

  // Get fixture statistics
  apiRouter.get("/fixtures/:id/statistics", async (req: Request, res: Response) => {
    try {
      const fixtureId = parseInt(req.params.id);
      const teamId = req.query.team ? parseInt(req.query.team as string) : undefined;

      console.log(`📊 [Stats API] Fetching statistics for fixture ${fixtureId}${teamId ? `, team ${teamId}` : ''}`);

      const statistics = await rapidApiService.getFixtureStatistics(fixtureId, teamId);

      if (statistics) {
        console.log(`📊 [Stats API] Fetched statistics for fixture ${fixtureId}`);
        res.json(statistics);
      } else {
        console.log(`📊 [Stats API] No statistics found for fixture ${fixtureId}`);
        res.status(404).json({ error: "Statistics not found" });
      }
    } catch (error) {
      console.error(`❌ [Stats API] Error fetching statistics:`, error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // RapidAPI Key and Base URL
   const RAPIDAPI_KEY = process.env.RAPID_API_KEY || '';
   const RAPIDAPI_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

  // Get fixture by ID
  apiRouter.get("/fixtures/:id", async (req: Request, res: Response) => {
    try {
      const fixtureId = parseInt(req.params.id);

      if (!fixtureId) {
        return res.status(400).json({ error: "Invalid fixture ID" });
      }

      console.log(`🔍 [Routes] Fetching fresh data for fixture ${fixtureId}`);

      // Always fetch fresh data for single fixture requests
      const response = await axios.get(`${RAPIDAPI_BASE_URL}/fixtures`, {
        params: {
          id: fixtureId
        },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      });

      if (response.data?.response && response.data.response.length > 0) {
        const fixture = response.data.response[0];
        console.log(`✅ [Routes] Fresh fixture ${fixtureId} status: ${fixture.fixture.status.short}, score: ${fixture.goals.home}-${fixture.goals.away}`);
        return res.json(fixture);
      } else {
        console.warn(`⚠️ [Routes] No data found for fixture ${fixtureId}`);
        return res.status(404).json({ error: "Fixture not found" });
      }
    } catch (error) {
      console.error(`❌ [Routes] Error fetching fixture ${req.params.id}:`, error);
      return res.status(500).json({ error: "Failed to fetch fixture" });
    }
  });

  // Get fixtures by ID
  apiRouter.get("/fixtures", async (req: Request, res: Response) => {
    try {
      const { ids, _t } = req.query;

      if (!ids) {
        return res.status(400).json({ error: "Fixture IDs are required" });
      }

      const fixtureIds = String(ids).split(',').map(id => parseInt(id.trim()));
      const fixtures = [];
      const bypassCache = !!_t; // Cache bypass if timestamp param is present

      for (const id of fixtureIds) {
        if (isNaN(id)) continue;

        if (bypassCache) {
          console.log(`🔄 [API] Bypassing cache for fixture ${id} (fresh request)`);
        }

        const fixture = await rapidApiService.getFixtureById(id);
        if (fixture) {
          fixtures.push(fixture);
        }
      }

      // Set shorter cache headers for fresh requests
      if (bypassCache) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }

      res.json(fixtures);
    } catch (error) {
      console.error("Error fetching fixtures by IDs:", error);
      res.status(500).json({ error: "Failed to fetch fixtures" });
    }
  });

    apiRouter.get("/simple/fixtures/live", async (req: Request, res: Response) => {
        try {
            console.log(`🔴 [SimpleAPI] Fetching live fixtures`);
            const fixtures = await simpleRapidApi.getLiveFixtures();
            res.json(fixtures);
        } catch (error) {
            console.error("Error fetching live fixtures using simple API:", error);
            res.status(500).json({ error: "Failed to fetch live fixtures using simple API" });
        }
    });

    apiRouter.get("/simple/fixtures/:date", async (req: Request, res: Response) => {
        try {
            const { date } = req.params;

            if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
            }

            console.log(`🔍 [SimpleAPI] Fetching fixtures for date: ${date}`);
            const fixtures = await simpleRapidApi.getFixturesByDate(date);
            res.json(fixtures);

        } catch (error) {
            console.error("Error fetching fixtures using simple API:", error);
            res.status(500).json({ error: "Failed to fetch fixtures using simple API" });
        }
    });

    apiRouter.get("/simple/leagues/:leagueId/fixtures", async (req: Request, res: Response) => {
        try {
            const { leagueId } = req.params;
            const { season } = req.query;

            const leagueIdNum = parseInt(leagueId);
            const seasonNum = season ? parseInt(season as string) : 2025;

            if (isNaN(leagueIdNum)) {
                return res.status(400).json({ error: "Invalid league ID" });
            }

            console.log(`🏆 [SimpleAPI] Fetching league ${leagueIdNum} fixtures for season ${seasonNum}`);
            const fixtures = await simpleRapidApi.getLeagueFixtures(leagueIdNum, seasonNum);
            res.json(fixtures);

        } catch (error) {
            console.error("Error fetching league fixtures using simple API:", error);
            res.status(500).json({ error: "Failed to fetch league fixtures using simple API" });
        }
    });

  // Player photo endpoint
  app.get('/api/players/:playerId/photo', playerRoutes);

  // Player statistics endpoint
  app.get('/api/players/:playerId/statistics', playerRoutes);

  // SofaScore player heatmap routes
  app.get('/api/players/:playerId/heatmap', async (req, res) => {
    try {
      const { playerId } = req.params;
      const { eventId, playerName, teamName, homeTeam, awayTeam, matchDate } = req.query;

      let sofaScorePlayerId = parseInt(playerId);
      let sofaScoreEventId = eventId ? parseInt(eventId as string) : null;

      // If we don't have a direct SofaScore event ID, try to find it
      if (!sofaScoreEventId && homeTeam && awayTeam && matchDate) {
        sofaScoreEventId = await sofaScoreAPI.findEventBySimilarity(
          homeTeam as string,
          awayTeam as string,
          matchDate as string
        );
      }

      // If we don't have a direct SofaScore player ID, try to find the player
      if (playerName && teamName) {
        const foundId = await sofaScoreAPI.findPlayerBySimilarity(
          playerName as string,
          teamName as string
        );
        if (foundId) sofaScorePlayerId = foundId;
      }

      if (!sofaScoreEventId) {
        console.log(`⚠️ [SofaScore] No valid event ID found for heatmap request`);
        return res.status(400).json({
          error: 'Could not find valid SofaScore event ID',
          suggestion: 'Please provide eventId, or homeTeam + awayTeam + matchDate'
        });
      }

      console.log(`🔍 [SofaScore] Fetching heatmap - Player: ${sofaScorePlayerId}, Event: ${sofaScoreEventId}`);

      const heatmapData = await sofaScoreAPI.getPlayerHeatmap(
        sofaScorePlayerId,
        sofaScoreEventId
      );

      if (heatmapData && heatmapData.heatmap.length > 0) {
        console.log(`✅ [SofaScore] Successfully retrieved REAL heatmap data with ${heatmapData.heatmap.length} points`);
        res.json({
          ...heatmapData,
          source: 'sofascore',
          playerId: sofaScorePlayerId,
          eventId: sofaScoreEventId,
          message: 'SofaScore Data'
        });
      } else {
        console.log(`⚠️ [SofaScore] No real data available, returning error message instead of fallback`);
        // Return error instead of demo data as requested
        res.status(404).json({
          error: 'Real SofaScore heatmap data not available',
          source: 'error',
          playerId: sofaScorePlayerId,
          eventId: sofaScoreEventId,
          suggestion: 'Check if the player ID and event ID are correct for SofaScore API'
        });
      }
    } catch (error) {
      console.error('❌ [SofaScore] Error fetching player heatmap:', error);
      res.status(500).json({
        error: 'Failed to fetch heatmap data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/players/:playerId/sofascore-stats', async (req, res) => {
    try {
      const { playerId } = req.params;
      const { eventId, playerName, teamName } = req.query;

      let sofaScorePlayerId = parseInt(playerId);

      if (playerName && teamName) {
        const foundId = await sofaScoreAPI.findPlayerBySimilarity(
          playerName as string,
          teamName as string
        );
        if (foundId) sofaScorePlayerId = foundId;
      }

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      const stats = await sofaScoreAPI.getPlayerStats(
        sofaScorePlayerId,
        parseInt(eventId as string)
      );

      if (stats) {
        res.json(stats);
      } else {
        // Fallback to existing stats endpoint
        res.redirect(`/api/players/${playerId}/stats`);
      }
    } catch (error) {
      console.error('Error fetching SofaScore stats:', error);
      res.status(500).json({ error: 'Failed to fetch SofaScore stats' });
    }
  });

  // Register 365scores stats routes
  app.use('/api/365scores', keyPlayersRoutes);
  app.use('/api/365scores', scores365StatsRoutes);

  // Use routers
  app.use('/api', featuredMatchRoutes);
  app.use('/api', highlightsRoutes);
  app.use('/api', playerDataRoutes);
  app.use('/api', playerRoutes);
  app.use('/api', playersRoutes);
  app.use('/api', youtubeRoutes);
  app.use('/api/fixtures', selectiveLiveRoutes);
  app.use('/api/fixtures', selectiveUpdatesRoutes);

  // Predictions routes
  app.use('/api', predictionsRoutes);
  app.use('/api', basketballRoutes);
  app.use('/api/basketball/standings', basketballStandingsRoutes);
  app.use('/api/basketball', basketballGamesRoutes);
  app.use("/api/translations", translationRoutes);

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Shots endpoint for match shot data
app.get('/api/fixtures/:fixtureId/shots', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    if (!fixtureId || isNaN(Number(fixtureId))) {
      return res.status(400).json({
        error: 'Invalid fixture ID provided'
      });
    }

    // Try to fetch from RapidAPI
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics?fixture=${fixtureId}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      console.error(`RapidAPI shots error for fixture ${fixtureId}:`, response.status);
      return res.status(500).json({
        error: 'Failed to fetch shot data',
        details: `API responded with status ${response.status}`
      });
    }

    const data = await response.json();

    // Transform the statistics data to extract shot information
    const shotsData = data.response?.map((team: any) => ({
      team: team.team,
      statistics: team.statistics?.filter((stat: any) =>
        stat.type?.toLowerCase().includes('shot') ||
        stat.type?.toLowerCase().includes('goal')
      ) || []
    })) || [];

    res.json({
      fixture: fixtureId,
      shots: shotsData
    });

  } catch (error) {
    console.error(`Error fetching shots for fixture ${fixtureId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  // Get head-to-head data
  app.get("/api/fixtures/headtohead", async (req, res) => {
    try {
      const { h2h, last } = req.query;

      // Validate h2h parameter
      if (!h2h || typeof h2h !== 'string') {
        console.warn(`❌ Missing or invalid h2h parameter: ${h2h}`);
        return res.status(400).json({ error: "h2h parameter is required and must be in format 'team1-team2'" });
      }

      // Parse and validate team IDs
      const teamIdParts = h2h.split("-");
      if (teamIdParts.length !== 2) {
        console.warn(`❌ Invalid h2h format: ${h2h}. Expected format: 'team1-team2'`);
        return res.status(400).json({ error: "h2h parameter must be in format 'team1-team2'" });
      }

      const teamIds = teamIdParts.map(id => parseInt(id.trim()));

      // Validate team IDs are valid numbers
      if (teamIds.some(id => isNaN(id) || id <= 0)) {
        console.warn(`❌ Invalid team IDs in h2h: ${h2h}. Team IDs: ${teamIds}`);
        return res.status(400).json({ error: "Invalid team IDs. Both team IDs must be positive numbers." });
      }

      // Validate limit parameter
      let limit = 10; // default
      if (last) {
        const parsedLimit = parseInt(last as string);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
          console.warn(`❌ Invalid last parameter: ${last}. Using default: 10`);
        } else {
          limit = parsedLimit;
        }
      }

      console.log(`🔍 Fetching H2H data for teams: ${teamIds[0]} vs ${teamIds[1]}, last ${limit} matches`);

      try {
        const h2hData = await rapidApiService.getHeadToHead(teamIds[0], teamIds[1], limit);

        if (!h2hData) {
          console.log(`📊 No H2H data available for teams ${teamIds[0]} vs ${teamIds[1]}`);
          return res.json([]);
        }

        console.log(`✅ Successfully retrieved H2H data for teams ${teamIds[0]} vs ${teamIds[1]}`);
        res.json(h2hData);
      } catch (apiError: any) {
        console.error(`🚨 RapidAPI error for H2H ${teamIds[0]} vs ${teamIds[1]}:`, apiError.message || apiError);

        if (apiError.message?.includes('rate limit') || apiError.message?.includes('429')) {
          return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
        }

        if (apiError.message?.includes('timeout')) {
          return res.status(504).json({ error: "Request timeout. Please try again." });
        }

        // Return empty array for API failures instead of error
        console.log(`📊 Returning empty H2H array due to API failure for teams ${teamIds[0]} vs ${teamIds[1]}`);
        res.json([]);
      }
    } catch (error: any) {
      console.error(`💥 Unexpected error fetching H2H data:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}

// Utility function to get country flag with fallback chain
async function getCountryFlag(country: string): Promise<string | null> {
  try {
    // If SportsRadar fails, try 365scores CDN
    console.log(
      `SportsRadar flag not found for ${country}, trying 365scores CDN fallback`,
    );
    let flagUrl = `https://sports.365scores.com/CDN/images/flags/${country}.svg`;

    // Check if the 365scores flag exists (naive check)
    const response = await fetch(flagUrl, { method: "HEAD" });
    if (response.ok) {
      return flagUrl;
    } else {
      console.log(`365scores CDN flag not found for ${country}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching country flag:", error);
    return null;
  }
}