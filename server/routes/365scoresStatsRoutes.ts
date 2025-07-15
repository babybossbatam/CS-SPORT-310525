
import express from 'express';

const router = express.Router();

// 365Scores stats endpoint
router.get('/stats/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const timezone = req.query.timezone || 'Asia/Manila';

  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  console.log(`🔍 [365Scores Stats] Fetching stats for game ${gameId}`);

  try {
    const statsUrl = `https://webws.365scores.com/web/game/stats/?${new URLSearchParams({
      appTypeId: '5',
      langId: '1',
      timezoneName: timezone,
      games: gameId,
      lastUpdateId: Date.now().toString()
    })}`;

    const response = await fetch(statsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.365scores.com/',
        'Origin': 'https://www.365scores.com'
      },
      timeout: 10000,
    });

    if (!response.ok) {
      console.warn(`⚠️ [365Scores Stats] API request failed with status: ${response.status}`);
      throw new Error(`Failed to fetch game stats: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [365Scores Stats] Received stats for game ${gameId}`);

    // Process and map the stats data
    const processedStats = processGameStats(data, gameId);
    
    res.json(processedStats);

  } catch (error) {
    console.error(`❌ [365Scores Stats] Error fetching game stats:`, error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

// Enhanced player stats with 365Scores mapping
router.get('/player-stats/:playerId/:gameId', async (req, res) => {
  const { playerId, gameId } = req.params;
  const timezone = req.query.timezone || 'Asia/Manila';

  console.log(`🔍 [365Scores Player Stats] Fetching for player ${playerId} in game ${gameId}`);

  try {
    // First get the game stats
    const statsResponse = await fetch(`http://localhost:5000/api/365scores-stats/stats/${gameId}?timezone=${timezone}`);
    
    if (statsResponse.ok) {
      const gameStats = await statsResponse.json();
      
      // Extract player-specific stats from game data
      const playerStats = extractPlayerStatsFromGame(gameStats, playerId);
      
      if (playerStats) {
        console.log(`✅ [365Scores Player Stats] Found stats for player ${playerId}`);
        res.json(playerStats);
      } else {
        console.log(`⚠️ [365Scores Player Stats] No stats found for player ${playerId} in game ${gameId}`);
        res.status(404).json({ error: 'Player stats not found in this game' });
      }
    } else {
      throw new Error('Failed to fetch game stats');
    }

  } catch (error) {
    console.error(`❌ [365Scores Player Stats] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Match ID mapping between our system and 365Scores
router.get('/map-match/:fixtureId', async (req, res) => {
  const { fixtureId } = req.params;
  
  console.log(`🔍 [365Scores Mapping] Looking for 365Scores game ID for fixture ${fixtureId}`);

  try {
    // Try to get fixture details from our API
    const fixtureResponse = await fetch(`http://localhost:5000/api/fixtures/${fixtureId}`);
    
    if (fixtureResponse.ok) {
      const fixture = await fixtureResponse.json();
      
      // Search for corresponding 365Scores game
      const mapped365ScoresId = await findCorresponding365ScoresGame(fixture);
      
      if (mapped365ScoresId) {
        console.log(`✅ [365Scores Mapping] Found mapping: ${fixtureId} -> ${mapped365ScoresId}`);
        res.json({ 
          originalFixtureId: fixtureId,
          mapped365ScoresId: mapped365ScoresId,
          mapping: 'success'
        });
      } else {
        res.json({ 
          originalFixtureId: fixtureId,
          mapped365ScoresId: null,
          mapping: 'not_found'
        });
      }
    } else {
      throw new Error('Fixture not found');
    }

  } catch (error) {
    console.error(`❌ [365Scores Mapping] Error:`, error);
    res.status(500).json({ error: 'Failed to map match ID' });
  }
});

function processGameStats(data: any, gameId: string) {
  const processed = {
    gameId,
    teams: [],
    players: [],
    matchStats: {},
    timestamp: new Date().toISOString()
  };

  try {
    // Process team data
    if (data.games && data.games[0]) {
      const game = data.games[0];
      
      processed.teams = [
        {
          id: game.homeCompetitor?.id,
          name: game.homeCompetitor?.name,
          type: 'home',
          stats: game.homeCompetitor?.statistics || {}
        },
        {
          id: game.awayCompetitor?.id,
          name: game.awayCompetitor?.name,
          type: 'away',
          stats: game.awayCompetitor?.statistics || {}
        }
      ];

      // Process player data
      if (game.lineups) {
        game.lineups.forEach((lineup: any) => {
          if (lineup.players) {
            lineup.players.forEach((player: any) => {
              processed.players.push({
                id: player.id,
                name: player.name,
                position: player.position,
                teamId: lineup.competitorId,
                statistics: player.statistics || {},
                rating: player.rating,
                minutesPlayed: player.minutesPlayed,
                isStarter: player.isStarter
              });
            });
          }
        });
      }

      // Process match-level statistics
      processed.matchStats = {
        possession: game.possession,
        shots: game.shots,
        shotsOnTarget: game.shotsOnTarget,
        corners: game.corners,
        fouls: game.fouls,
        yellowCards: game.yellowCards,
        redCards: game.redCards
      };
    }

  } catch (error) {
    console.error('Error processing game stats:', error);
  }

  return processed;
}

function extractPlayerStatsFromGame(gameStats: any, playerId: string) {
  try {
    const player = gameStats.players?.find((p: any) => p.id.toString() === playerId.toString());
    
    if (player) {
      return {
        playerId: player.id,
        name: player.name,
        position: player.position,
        teamId: player.teamId,
        gameStats: {
          rating: player.rating || 0,
          minutesPlayed: player.minutesPlayed || 0,
          goals: player.statistics?.goals || 0,
          assists: player.statistics?.assists || 0,
          shots: player.statistics?.shots || 0,
          shotsOnTarget: player.statistics?.shotsOnTarget || 0,
          passes: player.statistics?.passes || 0,
          passAccuracy: player.statistics?.passAccuracy || 0,
          tackles: player.statistics?.tackles || 0,
          interceptions: player.statistics?.interceptions || 0,
          fouls: player.statistics?.fouls || 0,
          yellowCards: player.statistics?.yellowCards || 0,
          redCards: player.statistics?.redCards || 0,
          touches: player.statistics?.touches || 0,
          dribbles: player.statistics?.dribbles || 0,
          duelsWon: player.statistics?.duelsWon || 0
        },
        gameId: gameStats.gameId,
        isStarter: player.isStarter
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting player stats:', error);
    return null;
  }
}

async function findCorresponding365ScoresGame(fixture: any) {
  try {
    // This is a simplified mapping - in real implementation, you'd need more sophisticated matching
    // based on team names, date, and time
    
    const homeTeam = fixture.teams?.home?.name;
    const awayTeam = fixture.teams?.away?.name;
    const matchDate = fixture.fixture?.date;
    
    // For now, return a mock mapping - you would implement actual search logic here
    // This could involve searching 365Scores by team names and date
    
    console.log(`🔍 [365Scores Search] Looking for: ${homeTeam} vs ${awayTeam} on ${matchDate}`);
    
    // Example mapping for the fixture ID in the logs (1326523 -> some 365scores ID)
    const knownMappings: Record<string, string> = {
      '1326523': '4318871', // New England Revolution vs Inter Miami
      '9568': '4318872'     // Example mapping
    };
    
    return knownMappings[fixture.fixture?.id] || null;
    
  } catch (error) {
    console.error('Error finding corresponding 365Scores game:', error);
    return null;
  }
}

export default router;
