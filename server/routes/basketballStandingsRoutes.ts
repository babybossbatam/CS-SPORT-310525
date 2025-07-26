
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

// Get basketball top scorers (mock data)
router.get('/top-scorers', async (req, res) => {
  try {
    const mockTopScorers = [
      {
        player: {
          id: 1,
          name: "LeBron James",
          photo: "https://media.api-sports.io/basketball/players/1.png"
        },
        statistics: [{
          team: { name: "Los Angeles Lakers" },
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
          team: { name: "Golden State Warriors" },
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
          team: { name: "Phoenix Suns" },
          goals: { total: 25 }
        }]
      },
      {
        player: {
          id: 4,
          name: "Giannis Antetokounmpo",
          photo: "https://media.api-sports.io/basketball/players/4.png"
        },
        statistics: [{
          team: { name: "Milwaukee Bucks" },
          goals: { total: 24 }
        }]
      },
      {
        player: {
          id: 5,
          name: "Luka Dončić",
          photo: "https://media.api-sports.io/basketball/players/5.png"
        },
        statistics: [{
          team: { name: "Dallas Mavericks" },
          goals: { total: 23 }
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
