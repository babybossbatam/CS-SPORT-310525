
import express from 'express';
import axios from 'axios';
import { sofaScoreMapping } from '../services/sofascoreMapping';

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527';

// Get player heatmap data using direct SofaScore search
router.get('/player-heatmap/:matchId/:playerId', async (req, res) => {
  try {
    const { matchId, playerId } = req.params;
    const { playerName, teamName, homeTeam, awayTeam, matchDate } = req.query;

    console.log(`🔥 [SofaScore Direct] Heatmap request for ${playerName} in ${homeTeam} vs ${awayTeam}`);

    if (!playerName || !homeTeam || !awayTeam || !matchDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: playerName, homeTeam, awayTeam, matchDate' 
      });
    }

    // Search for the match in SofaScore
    const sofaScoreMatch = await sofaScoreMapping.searchSofaScoreMatches(
      homeTeam as string, 
      awayTeam as string, 
      matchDate as string
    );

    if (!sofaScoreMatch) {
      console.log(`❌ [SofaScore Direct] Match not found: ${homeTeam} vs ${awayTeam}`);
      return res.status(404).json({ 
        error: 'Match not found in SofaScore',
        matchInfo: {
          homeTeam,
          awayTeam,
          matchDate,
          originalMatchId: matchId
        }
      });
    }

    console.log(`✅ [SofaScore Direct] Found match: ${sofaScoreMatch.homeTeam.name} vs ${sofaScoreMatch.awayTeam.name} (ID: ${sofaScoreMatch.id})`);

    // Search for the player in SofaScore
    const sofaScorePlayer = await sofaScoreMapping.searchSofaScorePlayers(
      playerName as string,
      teamName as string
    );

    if (!sofaScorePlayer) {
      console.log(`❌ [SofaScore Direct] Player not found: ${playerName}`);
      return res.status(404).json({ 
        error: 'Player not found in SofaScore',
        playerInfo: {
          playerName,
          teamName,
          originalPlayerId: playerId,
          matchId: sofaScoreMatch.id
        }
      });
    }

    console.log(`✅ [SofaScore Direct] Found player: ${sofaScorePlayer.name} (ID: ${sofaScorePlayer.id})`);

    // Get heatmap data from SofaScore
    const heatmapData = await sofaScoreMapping.getSofaScoreHeatmap(
      sofaScoreMatch.id,
      sofaScorePlayer.id
    );

    if (heatmapData) {
      console.log(`✅ [SofaScore Direct] Successfully fetched heatmap data`);
      res.json({
        ...heatmapData,
        mappingInfo: {
          originalPlayerId: playerId,
          originalMatchId: matchId,
          sofaScorePlayerId: sofaScorePlayer.id,
          sofaScoreMatchId: sofaScoreMatch.id,
          playerName: sofaScorePlayer.name,
          matchName: `${sofaScoreMatch.homeTeam.name} vs ${sofaScoreMatch.awayTeam.name}`
        }
      });
    } else {
      console.log(`⚠️ [SofaScore Direct] No heatmap data available`);
      res.status(404).json({ 
        error: 'No heatmap data available',
        mappingInfo: {
          originalPlayerId: playerId,
          originalMatchId: matchId,
          sofaScorePlayerId: sofaScorePlayer.id,
          sofaScoreMatchId: sofaScoreMatch.id,
          playerName: sofaScorePlayer.name,
          matchName: `${sofaScoreMatch.homeTeam.name} vs ${sofaScoreMatch.awayTeam.name}`
        }
      });
    }

  } catch (error) {
    console.error(`❌ [SofaScore Direct] Error fetching heatmap:`, error);

    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Heatmap data not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
  }
});

// Get player statistics using direct SofaScore search
router.get('/player-stats/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { playerName, teamName } = req.query;

    console.log(`📊 [SofaScore Direct] Stats request for ${playerName}`);

    if (!playerName) {
      return res.status(400).json({ error: 'playerName is required' });
    }

    // Search for the player in SofaScore
    const sofaScorePlayer = await sofaScoreMapping.searchSofaScorePlayers(
      playerName as string,
      teamName as string || ''
    );

    if (!sofaScorePlayer) {
      return res.status(404).json({ 
        error: 'Player not found in SofaScore',
        playerName,
        teamName
      });
    }

    const response = await axios.get('https://sofascore.p.rapidapi.com/players/get-statistics', {
      params: {
        playerId: sofaScorePlayer.id
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'sofascore.p.rapidapi.com'
      },
      timeout: 10000
    });

    if (response.data) {
      console.log(`✅ [SofaScore Direct] Successfully fetched player stats`);
      res.json({
        ...response.data,
        mappingInfo: {
          originalPlayerId: playerId,
          sofaScorePlayerId: sofaScorePlayer.id,
          playerName: sofaScorePlayer.name
        }
      });
    } else {
      res.status(404).json({ error: 'No player stats found' });
    }
  } catch (error) {
    console.error(`❌ [SofaScore Direct] Error fetching player stats:`, error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Search and find player endpoint
router.get('/search-player', async (req, res) => {
  try {
    const { playerName, teamName } = req.query;

    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    console.log(`🔍 [SofaScore Direct] Searching for player: ${playerName}`);

    const sofaScorePlayer = await sofaScoreMapping.searchSofaScorePlayers(
      playerName as string, 
      teamName as string || ''
    );

    if (sofaScorePlayer) {
      res.json({ 
        sofaScorePlayerId: sofaScorePlayer.id,
        playerName: sofaScorePlayer.name,
        teamName: sofaScorePlayer.team?.name,
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
    console.error(`❌ [SofaScore Direct] Error searching player:`, error);
    res.status(500).json({ error: 'Failed to search player' });
  }
});

// Search and find match endpoint
router.get('/search-match', async (req, res) => {
  try {
    const { homeTeam, awayTeam, matchDate } = req.query;

    if (!homeTeam || !awayTeam || !matchDate) {
      return res.status(400).json({ error: 'Home team, away team, and match date are required' });
    }

    console.log(`🔍 [SofaScore Direct] Searching for match: ${homeTeam} vs ${awayTeam} on ${matchDate}`);

    const sofaScoreMatch = await sofaScoreMapping.searchSofaScoreMatches(
      homeTeam as string, 
      awayTeam as string, 
      matchDate as string
    );

    if (sofaScoreMatch) {
      res.json({ 
        sofaScoreMatchId: sofaScoreMatch.id,
        homeTeam: sofaScoreMatch.homeTeam.name,
        awayTeam: sofaScoreMatch.awayTeam.name,
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
    console.error(`❌ [SofaScore Direct] Error searching match:`, error);
    res.status(500).json({ error: 'Failed to search match' });
  }
});

export default router;
