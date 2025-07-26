
import express, { Request, Response } from "express";
import { basketballApiService } from "../services/basketballApi";

const basketballRouter = express.Router();

// Get basketball games by date
basketballRouter.get("/games/date/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`🏀 [BasketballRoutes] Fetching games for date: ${date}`);

    const games = await basketballApiService.getGamesByDate(date);
    
    console.log(`✅ [BasketballRoutes] Returning ${games.length} games for ${date}`);
    res.json(games);
  } catch (error) {
    console.error('❌ [BasketballRoutes] Error fetching games by date:', error);
    res.status(500).json({ error: 'Failed to fetch basketball games' });
  }
});

// Get basketball games by league
basketballRouter.get("/games/league/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { season } = req.query;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid league ID' });
    }

    const seasonStr = season as string || "2024-2025";
    
    console.log(`🏀 [BasketballRoutes] Fetching league ${id} games for season ${seasonStr}`);

    const games = await basketballApiService.getGamesByLeague(id, seasonStr);
    
    console.log(`✅ [BasketballRoutes] Retrieved ${games.length} games for league ${id}`);
    res.json(games);
  } catch (error) {
    console.error(`❌ [BasketballRoutes] Error fetching games for league ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to fetch league games" });
  }
});

// Get live basketball games
basketballRouter.get("/games/live", async (req: Request, res: Response) => {
  try {
    console.log(`🔴 [BasketballRoutes] Fetching live games`);

    const liveGames = await basketballApiService.getLiveGames();
    
    console.log(`✅ [BasketballRoutes] Retrieved ${liveGames.length} live games`);
    res.json(liveGames);
  } catch (error) {
    console.error('❌ [BasketballRoutes] Error fetching live games:', error);
    res.status(500).json({ message: "Failed to fetch live games" });
  }
});

export default basketballRouter;
