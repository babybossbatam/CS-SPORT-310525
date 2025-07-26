import express from 'express';
import { basketballApiService } from '../services/basketballApi';

const router = express.Router();

// Get basketball standings for a league
router.get('/leagues/:leagueId/standings', async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Mock standings data - replace with actual API call when available
    const mockStandings = [
      {
        rank: 1,
        team: { id: 145, name: "Los Angeles Lakers", logo: "https://media.api-sports.io/basketball/teams/145.png" },
        all: { played: 25, win: 18, lose: 7 },
        points: 36
      },
      {
        rank: 2,
        team: { id: 149, name: "Golden State Warriors", logo: "https://media.api-sports.io/basketball/teams/149.png" },
        all: { played: 25, win: 17, lose: 8 },
        points: 34
      },
      {
        rank: 3,
        team: { id: 150, name: "Boston Celtics", logo: "https://media.api-sports.io/basketball/teams/150.png" },
        all: { played: 25, win: 16, lose: 9 },
        points: 32
      },
      {
        rank: 4,
        team: { id: 155, name: "Chicago Bulls", logo: "https://media.api-sports.io/basketball/teams/155.png" },
        all: { played: 25, win: 15, lose: 10 },
        points: 30
      },
      {
        rank: 5,
        team: { id: 142, name: "Miami Heat", logo: "https://media.api-sports.io/basketball/teams/142.png" },
        all: { played: 25, win: 14, lose: 11 },
        points: 28
      }
    ];

    res.json([mockStandings]);
  } catch (error) {
    console.error('Error fetching basketball standings:', error);
    res.status(500).json({ error: 'Failed to fetch basketball standings' });
  }
});

// Get live basketball games
router.get('/live', async (req, res) => {
  try {
    const liveGames = await basketballApiService.getLiveGames();
    res.json(liveGames);
  } catch (error) {
    console.error('Error fetching live basketball games:', error);
    res.status(500).json({ error: 'Failed to fetch live basketball games' });
  }
});

// Get basketball games by date
router.get('/games/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const games = await basketballApiService.getGamesByDate(date);
    res.json(games);
  } catch (error) {
    console.error('Error fetching basketball games by date:', error);
    res.status(500).json({ error: 'Failed to fetch basketball games' });
  }
});

// Get basketball top scorers by league
router.get('/top-scorers/:leagueId', async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId);
    const { season } = req.query;

    if (isNaN(leagueId)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    const seasonStr = season as string || "2024";

    console.log(`🏀 [BasketballStandings] Fetching top scorers for league ${leagueId}, season ${seasonStr}`);

    const topScorers = await basketballApiService.getTopScorers(leagueId, seasonStr);
    
    console.log(`✅ [BasketballStandings] Retrieved ${topScorers.length} top scorers for league ${leagueId}`);
    res.json(topScorers);
    
  } catch (error) {
    console.error(`❌ [BasketballStandings] Error fetching top scorers for league ${req.params.leagueId}:`, error);
    res.status(500).json({ error: 'Failed to fetch basketball top scorers' });
  }
});

// Get basketball standings by league
router.get('/standings/:leagueId', async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId);
    const { season } = req.query;

    if (isNaN(leagueId)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    const seasonStr = season as string || "2024";

    console.log(`🏀 [BasketballStandings] Fetching standings for league ${leagueId}, season ${seasonStr}`);

    const standings = await basketballApiService.getStandings(leagueId, seasonStr);
    
    console.log(`✅ [BasketballStandings] Retrieved standings for league ${leagueId}`);
    res.json(standings);
    
  } catch (error) {
    console.error(`❌ [BasketballStandings] Error fetching standings for league ${req.params.leagueId}:`, error);
    res.status(500).json({ error: 'Failed to fetch basketball standings' });
  }`);

    try {
      // Fetch real basketball player statistics using proper basketball API
      const topScorers = await basketballApiService.getTopScorers(leagueId, seasonStr);
      
      if (topScorers && topScorers.length > 0) {
        console.log(`✅ [BasketballStandings] Returning ${topScorers.length} real top scorers for league ${leagueId}`);
        return res.json(topScorers);
      } else {
        console.warn(`⚠️ [BasketballStandings] No top scorers data available for league ${leagueId}`);
        return res.status(404).json({ 
          error: 'No top scorers data available',
          message: `No player statistics found for league ${leagueId} in season ${seasonStr}. This may be because the season hasn't started or the league doesn't have player statistics available.`,
          leagueId,
          season: seasonStr
        });
      }
    } catch (apiError) {
      console.error(`❌ [BasketballStandings] API call failed for league ${leagueId}:`, apiError);
      return res.status(500).json({ 
        error: 'Failed to fetch basketball top scorers',
        message: `Basketball API error for league ${leagueId}: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        leagueId,
        season: seasonStr
      });
    }
  } catch (error) {
    console.error('Error fetching basketball top scorers:', error);
    res.status(500).json({ error: 'Failed to fetch basketball top scorers' });
  }
});

// Helper function to get league name by ID
function getLeagueName(leagueId: number): string {
  const leagueNames = {
    12: "NBA",
    120: "EuroLeague",
    121: "Liga ACB",
    122: "Lega Basket Serie A",
    123: "Bundesliga",
    124: "LNB Pro A"
  };
  return leagueNames[leagueId as keyof typeof leagueNames] || "Basketball League";
}

// Get basketball top scorers (legacy endpoint - keep for compatibility)
router.get('/top-scorers', async (req, res) => {
  try {
    // Redirect to NBA (league 12) by default
    const mockTopScorers = [
      {
        player: {
          id: 1,
          name: "LeBron James",
          photo: "https://media.api-sports.io/basketball/players/1.png"
        },
        statistics: [{
          team: { 
            id: 145,
            name: "Los Angeles Lakers",
            logo: "https://media.api-sports.io/basketball/teams/145.png"
          },
          league: {
            id: 12,
            name: "NBA",
            season: 2025
          },
          games: {
            appearences: 25,
            position: "Forward"
          },
          goals: { total: 28 }
        }]
      },
      {
        player: {
          id: 2,
          name: "Stephen Curry",
          photo: "https://media.api-sports.io/basketball/players/2.png"
        },
        statistics: [{
          team: { 
            id: 149,
            name: "Golden State Warriors",
            logo: "https://media.api-sports.io/basketball/teams/149.png"
          },
          league: {
            id: 12,
            name: "NBA",
            season: 2025
          },
          games: {
            appearences: 24,
            position: "Guard"
          },
          goals: { total: 26 }
        }]
      },
      {
        player: {
          id: 3,
          name: "Kevin Durant",
          photo: "https://media.api-sports.io/basketball/players/3.png"
        },
        statistics: [{
          team: { 
            id: 164,
            name: "Phoenix Suns",
            logo: "https://media.api-sports.io/basketball/teams/164.png"
          },
          league: {
            id: 12,
            name: "NBA",
            season: 2025
          },
          games: {
            appearences: 23,
            position: "Forward"
          },
          goals: { total: 25 }
        }]
      }
    ];

    res.json(mockTopScorers);
  } catch (error) {
    console.error('Error fetching basketball top scorers:', error);
    res.status(500).json({ error: 'Failed to fetch basketball top scorers' });
  }
});

export default router;