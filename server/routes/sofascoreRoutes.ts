
import { Router } from 'express';
import { sofaScoreAPI } from '../services/sofascoreApi';

const router = Router();

// Find SofaScore event ID by team names and date
router.get('/find-event', async (req, res) => {
  try {
    const { homeTeam, awayTeam, matchDate } = req.query;

    if (!homeTeam || !awayTeam || !matchDate) {
      return res.status(400).json({ 
        error: 'homeTeam, awayTeam, and matchDate are required' 
      });
    }

    console.log(`🔍 [SofaScore] Searching for event: ${homeTeam} vs ${awayTeam} on ${matchDate}`);

    const eventId = await sofaScoreAPI.findEventBySimilarity(
      homeTeam as string,
      awayTeam as string,
      matchDate as string
    );

    if (eventId) {
      console.log(`✅ [SofaScore] Found event ID: ${eventId}`);
      res.json({ eventId, homeTeam, awayTeam, matchDate });
    } else {
      console.log(`⚠️ [SofaScore] No matching event found`);
      res.status(404).json({ 
        error: 'No matching SofaScore event found',
        homeTeam,
        awayTeam,
        matchDate
      });
    }
  } catch (error) {
    console.error('❌ [SofaScore] Error finding event:', error);
    res.status(500).json({ 
      error: 'Failed to find SofaScore event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get shotmap data for a specific SofaScore event
router.get('/shotmap/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || isNaN(Number(eventId))) {
      return res.status(400).json({ error: 'Valid eventId is required' });
    }

    console.log(`🎯 [SofaScore] Fetching shotmap for event: ${eventId}`);

    const shotmapData = await sofaScoreAPI.getShotmapData(Number(eventId));

    if (shotmapData && shotmapData.shotmap.length > 0) {
      console.log(`✅ [SofaScore] Retrieved shotmap with ${shotmapData.shotmap.length} shots`);
      res.json({
        ...shotmapData,
        eventId: Number(eventId),
        source: 'sofascore'
      });
    } else {
      console.log(`⚠️ [SofaScore] No shotmap data found for event ${eventId}`);
      res.status(404).json({ 
        error: 'No shotmap data found for this event',
        eventId: Number(eventId)
      });
    }
  } catch (error) {
    console.error('❌ [SofaScore] Error fetching shotmap:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shotmap data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get player shots for a specific event
router.get('/player-shots/:eventId/:playerId', async (req, res) => {
  try {
    const { eventId, playerId } = req.params;

    if (!eventId || !playerId || isNaN(Number(eventId)) || isNaN(Number(playerId))) {
      return res.status(400).json({ error: 'Valid eventId and playerId are required' });
    }

    console.log(`🎯 [SofaScore] Fetching player shots: Event ${eventId}, Player ${playerId}`);

    const playerShots = await sofaScoreAPI.getPlayerShots(Number(playerId), Number(eventId));

    if (playerShots && playerShots.length > 0) {
      console.log(`✅ [SofaScore] Retrieved ${playerShots.length} shots for player ${playerId}`);
      res.json({
        shots: playerShots,
        eventId: Number(eventId),
        playerId: Number(playerId),
        source: 'sofascore'
      });
    } else {
      console.log(`⚠️ [SofaScore] No shots found for player ${playerId} in event ${eventId}`);
      res.status(404).json({ 
        error: 'No shots found for this player in this event',
        eventId: Number(eventId),
        playerId: Number(playerId)
      });
    }
  } catch (error) {
    console.error('❌ [SofaScore] Error fetching player shots:', error);
    res.status(500).json({ 
      error: 'Failed to fetch player shots',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Head-to-Head data for a specific SofaScore event
router.get('/h2h/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || isNaN(Number(eventId))) {
      return res.status(400).json({ error: 'Valid eventId is required' });
    }

    console.log(`🔄 [SofaScore] Fetching H2H for event: ${eventId}`);

    const h2hData = await sofaScoreAPI.getH2HData(Number(eventId));

    if (h2hData && h2hData.h2h.length > 0) {
      console.log(`✅ [SofaScore] Retrieved H2H with ${h2hData.h2h.length} historical matches`);
      res.json({
        ...h2hData,
        eventId: Number(eventId),
        source: 'sofascore'
      });
    } else {
      console.log(`⚠️ [SofaScore] No H2H data found for event ${eventId}`);
      res.status(404).json({ 
        error: 'No H2H data found for this event',
        eventId: Number(eventId)
      });
    }
  } catch (error) {
    console.error('❌ [SofaScore] Error fetching H2H data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch H2H data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
