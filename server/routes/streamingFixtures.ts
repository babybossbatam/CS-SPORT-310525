
import express, { Request, Response } from "express";
import { rapidApiService } from "../services/rapidApi";

const streamingFixturesRouter = express.Router();

// Streaming endpoint that sends data as it becomes available
streamingFixturesRouter.get("/stream/:date", async (req: Request, res: Response) => {
  const { date } = req.params;
  const { all } = req.query;

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  try {
    console.log(`🌊 [Streaming] Starting streaming response for ${date}`);

    // Send immediate response with cached data if available
    const cachedData = await getCachedFixturesForDate(date);
    if (cachedData && cachedData.length > 0) {
      res.write(`data: ${JSON.stringify({ 
        type: 'cached', 
        data: cachedData,
        timestamp: Date.now()
      })}\n\n`);
      console.log(`📦 [Streaming] Sent ${cachedData.length} cached fixtures`);
    }

    // Fetch fresh data in background and stream updates
    if (all === 'true') {
      // Fetch from multiple sources and stream as they arrive
      const datesToFetch = [
        new Date(Date.parse(date) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        date,
        new Date(Date.parse(date) + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      ];

      for (const fetchDate of datesToFetch) {
        try {
          const fixtures = await rapidApiService.getFixturesByDate(fetchDate, true);
          const validFixtures = fixtures.filter(f => {
            const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
            return fixtureDate === date;
          });

          if (validFixtures.length > 0) {
            res.write(`data: ${JSON.stringify({
              type: 'partial',
              data: validFixtures,
              source: fetchDate,
              timestamp: Date.now()
            })}\n\n`);
            console.log(`📊 [Streaming] Sent ${validFixtures.length} fixtures from ${fetchDate}`);
          }
        } catch (error) {
          console.error(`❌ [Streaming] Error fetching ${fetchDate}:`, error);
        }
      }
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      timestamp: Date.now()
    })}\n\n`);

  } catch (error) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message,
      timestamp: Date.now()
    })}\n\n`);
  } finally {
    res.end();
  }
});

export default streamingFixturesRouter;
