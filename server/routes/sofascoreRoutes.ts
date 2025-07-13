
import express from 'express';
import axios from 'axios';
import { sofaScoreMapping } from '../services/sofascoreMapping';

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527';

// Get player heatmap data with mapping
router.get('/player-heatmap/:matchId/:playerId', async (req, res) => {
  try {
    const { matchId, playerId } = req.params;
    const { playerName, teamName, homeTeam, awayTeam, matchDate } = req.query;
    
    console.log(`🔥 [SofaScore] Fetching heatmap for API-Football player ${playerId} in match ${matchId}`);
    console.log(`🔍 [SofaScore] Mapping data - Player: ${playerName}, Team: ${teamName}, Match: ${homeTeam} vs ${awayTeam}`);
    
    // First, try to map the match ID
    let sofaScoreMatchId = matchId;
    if (homeTeam && awayTeam && matchDate) {
      const mappedMatchId = await sofaScoreMapping.findSofaScoreMatchId(
        homeTeam as string, 
        awayTeam as string, 
        matchDate as string
      );
      if (mappedMatchId) {
        sofaScoreMatchId = mappedMatchId.toString();
        console.log(`🔄 [SofaScore] Mapped match ID: ${matchId} -> ${sofaScoreMatchId}`);
      }
    }
    
    // Then, try to map the player ID
    let sofaScorePlayerId = playerId;
    if (playerName && teamName) {
      const mappedPlayerId = await sofaScoreMapping.findSofaScorePlayerId(
        playerName as string, 
        teamName as string
      );
      if (mappedPlayerId) {
        sofaScorePlayerId = mappedPlayerId.toString();
        console.log(`🔄 [SofaScore] Mapped player ID: ${playerId} -> ${sofaScorePlayerId}`);
      }
    }
    
    const response = await axios.get('https://sofascore.p.rapidapi.com/matches/get-player-heatmap', {
      params: {
        matchId: sofaScoreMatchId,
        playerId: sofaScorePlayerId
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'sofascore.p.rapidapi.com'
      },
      timeout: 10000
    });

    if (response.data) {
      console.log(`✅ [SofaScore] Successfully fetched heatmap data for mapped player ${sofaScorePlayerId}`);


// Get player statistics with mapping
router.get('/player-stats/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { playerName, teamName } = req.query;
    
    console.log(`📊 [SofaScore] Fetching stats for API-Football player ${playerId}`);
    
    // Try to map the player ID
    let sofaScorePlayerId = playerId;
    if (playerName && teamName) {
      const mappedPlayerId = await sofaScoreMapping.findSofaScorePlayerId(
        playerName as string, 
        teamName as string
      );
      if (mappedPlayerId) {
        sofaScorePlayerId = mappedPlayerId.toString();
        console.log(`🔄 [SofaScore] Mapped player ID for stats: ${playerId} -> ${sofaScorePlayerId}`);
      }
    }
    
    const response = await axios.get('https://sofascore.p.rapidapi.com/players/get-statistics', {
      params: {
        playerId: sofaScorePlayerId
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'sofascore.p.rapidapi.com'
      },
      timeout: 10000
    });

    if (response.data) {
      console.log(`✅ [SofaScore] Successfully fetched player stats for ${sofaScorePlayerId}`);
      res.json(response.data);
    } else {
      res.status(404).json({ error: 'No player stats found' });
    }
  } catch (error) {
    console.error(`❌ [SofaScore] Error fetching player stats:`, error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Search and map player endpoint
router.get('/search-player', async (req, res) => {
  try {
    const { playerName, teamName } = req.query;
    
    if (!playerName || !teamName) {
      return res.status(400).json({ error: 'Player name and team name are required' });
    }
    
    console.log(`🔍 [SofaScore] Searching for player: ${playerName} in team: ${teamName}`);
    
    const sofaScorePlayerId = await sofaScoreMapping.findSofaScorePlayerId(
      playerName as string, 
      teamName as string
    );
    
    if (sofaScorePlayerId) {
      res.json({ 
        sofaScorePlayerId,
        playerName,
        teamName,
        mapped: true
      });
    } else {
      res.status(404).json({ 
        error: 'Player not found in SofaScore',
        playerName,
        teamName,
        mapped: false
      });
    }
  } catch (error) {
    console.error(`❌ [SofaScore] Error searching player:`, error);
    res.status(500).json({ error: 'Failed to search player' });
  }
});

// Search and map match endpoint
router.get('/search-match', async (req, res) => {
  try {
    const { homeTeam, awayTeam, matchDate } = req.query;
    
    if (!homeTeam || !awayTeam || !matchDate) {
      return res.status(400).json({ error: 'Home team, away team, and match date are required' });
    }
    
    console.log(`🔍 [SofaScore] Searching for match: ${homeTeam} vs ${awayTeam} on ${matchDate}`);
    
    const sofaScoreMatchId = await sofaScoreMapping.findSofaScoreMatchId(
      homeTeam as string, 
      awayTeam as string, 
      matchDate as string
    );
    
    if (sofaScoreMatchId) {
      res.json({ 
        sofaScoreMatchId,
        homeTeam,
        awayTeam,
        matchDate,
        mapped: true
      });
    } else {
      res.status(404).json({ 
        error: 'Match not found in SofaScore',
        homeTeam,
        awayTeam,
        matchDate,
        mapped: false
      });
    }
  } catch (error) {
    console.error(`❌ [SofaScore] Error searching match:`, error);
    res.status(500).json({ error: 'Failed to search match' });
  }
});

      res.json(response.data);
    } else {
      console.log(`⚠️ [SofaScore] No heatmap data found for mapped player ${sofaScorePlayerId}`);
      res.status(404).json({ error: 'No heatmap data found' });
    }
  } catch (error) {
    console.error(`❌ [SofaScore] Error fetching heatmap:`, error);
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Heatmap data not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
  }
});

export default router;
