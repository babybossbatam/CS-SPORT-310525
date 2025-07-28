
import express, { Request, Response } from "express";
import { rapidApiService } from "../services/rapidApi";
import { storage } from "../storage";

const popularLeaguesRouter = express.Router();

// Popular leagues with their priorities and metadata
const POPULAR_LEAGUES_CONFIG = [
  { id: 39, name: "Premier League", country: "England", popularity: 95, priority: 1 },
  { id: 2, name: "UEFA Champions League", country: "Europe", popularity: 92, priority: 2 },
  { id: 140, name: "La Liga", country: "Spain", popularity: 90, priority: 3 },
  { id: 1, name: "World Cup", country: "World", popularity: 88, priority: 4 },
  { id: 135, name: "Serie A", country: "Italy", popularity: 85, priority: 5 },
  { id: 78, name: "Bundesliga", country: "Germany", popularity: 83, priority: 6 },
  { id: 4, name: "Euro Championship", country: "World", popularity: 82, priority: 7 },
  { id: 61, name: "Ligue 1", country: "France", popularity: 78, priority: 8 },
  { id: 3, name: "UEFA Europa League", country: "Europe", popularity: 75, priority: 9 },
  { id: 15, name: "FIFA Club World Cup", country: "World", popularity: 72, priority: 10 },
  { id: 9, name: "Copa America", country: "World", popularity: 70, priority: 11 },
  { id: 848, name: "UEFA Conference League", country: "Europe", popularity: 68, priority: 12 },
  { id: 45, name: "FA Cup", country: "England", popularity: 65, priority: 13 },
  { id: 5, name: "UEFA Nations League", country: "Europe", popularity: 63, priority: 14 },
  { id: 143, name: "Copa del Rey", country: "Spain", popularity: 60, priority: 15 },
  { id: 137, name: "Coppa Italia", country: "Italy", popularity: 58, priority: 16 },
  { id: 81, name: "DFB Pokal", country: "Germany", popularity: 55, priority: 17 },
  { id: 22, name: "CONCACAF Gold Cup", country: "World", popularity: 52, priority: 18 },
  { id: 307, name: "Saudi Pro League", country: "Saudi Arabia", popularity: 50, priority: 19 },
  { id: 38, name: "UEFA U21 Championship", country: "World", popularity: 48, priority: 20 },
  { id: 7, name: "Asian Cup", country: "World", popularity: 45, priority: 21 },
  { id: 233, name: "Egyptian Premier League", country: "Egypt", popularity: 42, priority: 22 },
];

// Cache duration: 1 hour for popular leagues
const CACHE_DURATION = 60 * 60 * 1000;
let cachedPopularLeagues: any = null;
let cacheTimestamp = 0;

popularLeaguesRouter.get("/", async (req: Request, res: Response) => {
  try {
    console.log("🏆 [PopularLeagues] Fetching popular leagues data");

    // Check cache first
    const now = Date.now();
    if (cachedPopularLeagues && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`💾 [PopularLeagues] Returning cached data (${cachedPopularLeagues.length} leagues)`);
      return res.json(cachedPopularLeagues);
    }

    console.log("🔄 [PopularLeagues] Cache expired or empty, fetching fresh data");

    // Fetch all leagues from API to get updated logos and info
    const allLeagues = await rapidApiService.getLeagues();
    console.log(`📊 [PopularLeagues] Retrieved ${allLeagues?.length || 0} leagues from API`);
    
    const popularLeaguesData = [];

    for (const config of POPULAR_LEAGUES_CONFIG) {
      try {
        // Find the league in the API response
        const apiLeague = allLeagues.find(l => l.league.id === config.id);
        
        if (apiLeague) {
          popularLeaguesData.push({
            id: config.id,
            name: apiLeague.league.name || config.name,
            logo: apiLeague.league.logo || `https://media.api-sports.io/football/leagues/${config.id}.png`,
            country: apiLeague.country.name || config.country,
            popularity: config.popularity,
            priority: config.priority,
            flag: apiLeague.country.flag || null,
            type: apiLeague.league.type || "League",
            season: new Date().getFullYear()
          });
        } else {
          // Fallback to config data if not found in API
          popularLeaguesData.push({
            id: config.id,
            name: config.name,
            logo: `https://media.api-sports.io/football/leagues/${config.id}.png`,
            country: config.country,
            popularity: config.popularity,
            priority: config.priority,
            flag: null,
            type: "League",
            season: new Date().getFullYear()
          });
        }
      } catch (error) {
        console.error(`❌ [PopularLeagues] Error processing league ${config.id}:`, error);
        // Add fallback data
        popularLeaguesData.push({
          id: config.id,
          name: config.name,
          logo: `https://media.api-sports.io/football/leagues/${config.id}.png`,
          country: config.country,
          popularity: config.popularity,
          priority: config.priority,
          flag: null,
          type: "League",
          season: new Date().getFullYear()
        });
      }
    }

    // Sort by popularity (highest first)
    const sortedLeagues = popularLeaguesData.sort((a, b) => b.popularity - a.popularity);

    // Cache the results
    cachedPopularLeagues = sortedLeagues;
    cacheTimestamp = now;

    console.log(`✅ [PopularLeagues] Successfully fetched ${sortedLeagues.length} popular leagues`);
    res.json(sortedLeagues);

  } catch (error) {
    console.error("❌ [PopularLeagues] Error fetching popular leagues:", error);
    
    // If we have cached data, return it even if expired
    if (cachedPopularLeagues && cachedPopularLeagues.length > 0) {
      console.log("⚠️ [PopularLeagues] Returning expired cache due to error");
      return res.json(cachedPopularLeagues);
    }
    
    // Return fallback static data in case of API failure
    console.log("🔄 [PopularLeagues] Using fallback static data");
    const fallbackData = POPULAR_LEAGUES_CONFIG.map(config => ({
      id: config.id,
      name: config.name,
      logo: `https://media.api-sports.io/football/leagues/${config.id}.png`,
      country: config.country,
      popularity: config.popularity,
      priority: config.priority,
      flag: null,
      type: "League",
      season: new Date().getFullYear()
    })).sort((a, b) => b.popularity - a.popularity);

    // Cache the fallback data
    cachedPopularLeagues = fallbackData;
    cacheTimestamp = Date.now();

    res.json(fallbackData);
  }
});

// Endpoint to refresh cache manually
popularLeaguesRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    console.log("🔄 [PopularLeagues] Manual cache refresh requested");
    
    // Clear cache
    cachedPopularLeagues = null;
    cacheTimestamp = 0;
    
    // Fetch fresh data by calling the main endpoint logic
    req.url = "/";
    req.method = "GET";
    
    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    console.error("❌ [PopularLeagues] Error refreshing cache:", error);
    res.status(500).json({ error: "Failed to refresh cache" });
  }
});

export default popularLeaguesRouter;
