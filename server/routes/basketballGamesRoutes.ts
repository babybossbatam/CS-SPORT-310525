
import { Router } from 'express';
import { basketballApi } from '../services/basketballApi';

const router = Router();

// Get basketball games for a specific date
router.get('/games/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`🏀 [BasketballGames] Fetching games for date: ${date}`);
    
    // Popular basketball leagues from MyBasketPopularLeagues
    const popularLeagueIds = [12, 120, 1, 127, 2, 132, 133, 143, 122, 134];
    
    let allGames: any[] = [];
    
    for (const leagueId of popularLeagueIds) {
      try {
        const games = await basketballApi.getGamesByDate(date, leagueId);
        if (games && Array.isArray(games)) {
          allGames.push(...games);
        }
      } catch (error) {
        console.warn(`Failed to fetch games for league ${leagueId}:`, error);
      }
    }
    
    // Remove duplicates based on game ID
    const uniqueGames = allGames.filter((game, index, self) =>
      index === self.findIndex((g) => g.id === game.id)
    );
    
    console.log(`🏀 [BasketballGames] Found ${uniqueGames.length} games for ${date}`);
    res.json(uniqueGames);
    
  } catch (error) {
    console.error('Error fetching basketball games:', error);
    res.status(500).json({ error: 'Failed to fetch basketball games' });
  }
});

// Get live basketball games
router.get('/games/live', async (req, res) => {
  try {
    console.log(`🔴 [BasketballGames] Fetching live games`);
    
    const liveGames = await basketballApi.getLiveGames();
    
    if (liveGames && Array.isArray(liveGames)) {
      // Filter by popular leagues
      const popularLeagueIds = [12, 120, 1, 127, 2, 132, 133, 143, 122, 134];
      const filteredGames = liveGames.filter(game => 
        popularLeagueIds.includes(game.league?.id)
      );
      
      console.log(`🔴 [BasketballGames] Found ${filteredGames.length} live games`);
      res.json(filteredGames);
    } else {
      res.json([]);
    }
    
  } catch (error) {
    console.error('Error fetching live basketball games:', error);
    res.status(500).json({ error: 'Failed to fetch live basketball games' });
  }
});

export default router;
