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

    try {
      // Step 1: Test API connection first
      console.log(`🧪 [API CONNECTION TEST] Testing basketball API connection...`);
      const connectionTest = await basketballApiService.testConnection();
      console.log(`🧪 [API CONNECTION] Connection test result:`, JSON.stringify(connectionTest, null, 2));

      // Step 2: Test leagues endpoint
      console.log(`🔍 [API TEST] Testing basketball leagues endpoint...`);
      const leaguesData = await basketballApiService.getLeagues();
      console.log(`📊 [API TEST] Leagues response (first 3):`, JSON.stringify(leaguesData.slice(0, 3), null, 2));
      console.log(`📊 [API TEST] Total leagues found:`, leaguesData.length);

      // Step 3: Test games endpoint for this specific league
      console.log(`🔍 [API TEST] Testing games endpoint for league ${leagueId}...`);
      const gamesData = await basketballApiService.getGamesByLeague(leagueId, seasonStr);
      console.log(`📊 [API TEST] Games response for league ${leagueId} (first 2):`, JSON.stringify(gamesData.slice(0, 2), null, 2));
      console.log(`📊 [API TEST] Total games found for league ${leagueId}:`, gamesData.length);

      // Step 4: If we have games, try to get player statistics for one game
      if (gamesData.length > 0) {
        const sampleGame = gamesData[0];
        console.log(`🔍 [API TEST] Testing player statistics for sample game ${sampleGame?.id}...`);
        
        try {
          const playerStatsResponse = await basketballApiService.basketballApiClient.get("/games/statistics/players", {
            params: { id: sampleGame.id }
          });
          
          console.log(`📊 [API TEST] Player stats raw response:`, JSON.stringify({
            status: playerStatsResponse.status,
            statusText: playerStatsResponse.statusText,
            dataKeys: Object.keys(playerStatsResponse.data || {}),
            results: playerStatsResponse.data?.results,
            errors: playerStatsResponse.data?.errors,
            samplePlayerStat: playerStatsResponse.data?.response?.[0] || null
          }, null, 2));
        } catch (statsError) {
          console.error(`❌ [API TEST] Player stats test failed:`, statsError);
        }
      }

      // Step 5: Now try to get top scorers using the service method
      console.log(`🏀 [API TEST] Testing top scorers service method...`);
      const topScorers = await basketballApiService.getTopScorers(leagueId, seasonStr);
      console.log(`📊 [API TEST] Top scorers response:`, JSON.stringify(topScorers, null, 2));

      if (topScorers && topScorers.length > 0) {
        console.log(`✅ [BasketballStandings] Returning ${topScorers.length} real top scorers for league ${leagueId}`);
        return res.json(topScorers);
      } else {
        console.warn(`⚠️ [BasketballStandings] No top scorers data available for league ${leagueId}`);

        // Return detailed debug info with API response details
        return res.status(404).json({ 
          error: 'No top scorers data available',
          message: `No player statistics found for league ${leagueId} in season ${seasonStr}`,
          debug: {
            leagueId,
            season: seasonStr,
            connectionTest: !!connectionTest,
            leaguesFound: leaguesData.length,
            gamesFound: gamesData.length,
            sampleGame: gamesData[0] || null,
            apiHeaders: {
              'x-apisports-key': '81bc62b91b1190622beda24ee23fbd1a'
            },
            baseUrl: 'https://v1.basketball.api-sports.io'
          }
        });
      }
    } catch (apiError) {
      console.error(`❌ [BasketballStandings] API call failed for league ${leagueId}:`, apiError);
      
      // Log full error details
      if (apiError.response) {
        console.error(`❌ [BasketballStandings] API Error Response:`, {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data,
          headers: apiError.response.headers
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch basketball top scorers',
        message: `Basketball API error for league ${leagueId}: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        debug: {
          leagueId,
          season: seasonStr,
          errorType: apiError.name || 'Unknown',
          errorStatus: apiError.response?.status || 'No status',
          errorData: apiError.response?.data || 'No data',
          errorMessage: apiError.message || 'No message'
        }
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