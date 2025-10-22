
import express, { Request, Response } from "express";
import { rapidApiService } from "../services/rapidApi";
import { storage } from "../storage";

const featuredMatchRouter = express.Router();

// MyHomeFeaturedMatch specific endpoints with skip filtering capability
featuredMatchRouter.get("/live", async (req: Request, res: Response) => {
  try {
    const { skipFilter } = req.query;
    
    console.log(`🎯 [FeaturedMatch] Fetching live fixtures with skipFilter=${skipFilter}`);
    
    // Always fetch fresh live data without any filtering when called by MyHomeFeaturedMatch
    const fixtures = await rapidApiService.getLiveFixtures();
    console.log(`🔴 [FeaturedMatch] Retrieved ${fixtures.length} live fixtures (NO FILTERING)`);

    // Return all fixtures without any exclusion filtering
    return res.json(fixtures);
  } catch (error) {
    console.error('❌ [FeaturedMatch] Error fetching live fixtures:', error);
    res.status(500).json({ message: "Failed to fetch live fixtures" });
  }
});

featuredMatchRouter.get("/date/:date", async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { skipFilter, all } = req.query;

    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`🎯 [FeaturedMatch] Fetching fixtures for date: ${date} with skipFilter=${skipFilter}`);

    // Fetch with all=true to get 3-day window (timezone coverage)
    // Request coalescing in rapidApi service prevents duplicate API calls
    const fixtures = await rapidApiService.getFixturesByDate(date, true);
    console.log(`✅ [FeaturedMatch] Returning ${fixtures.length} unfiltered fixtures for ${date}`);
    
    return res.json(fixtures);
  } catch (error) {
    console.error('❌ [FeaturedMatch] Error fetching fixtures by date:', error);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

featuredMatchRouter.get("/leagues/:id/fixtures", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { skipFilter, season } = req.query;
    
    // Calculate current season
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentSeason = currentMonth >= 7 ? 
      currentDate.getFullYear() + 1 : 
      currentDate.getFullYear();
    const seasonYear = parseInt(season as string) || currentSeason;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid league ID' });
    }

    console.log(`🎯 [FeaturedMatch] Fetching league ${id} fixtures with skipFilter=${skipFilter}`);

    // Use API-Football directly without filtering
    const fixtures = await rapidApiService.getFixturesByLeague(id, seasonYear);
    console.log(`✅ [FeaturedMatch] Retrieved ${fixtures ? fixtures.length : 0} fixtures for league ${id} (NO FILTERING)`);

    res.json(fixtures);
  } catch (error) {
    console.error(`❌ [FeaturedMatch] Error fetching fixtures for league ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to fetch league fixtures" });
  }
});

// Endpoint specifically for MyHomeFeaturedMatch priority leagues
featuredMatchRouter.get("/priority-leagues", async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const today = date ? new Date(date as string) : new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log(`🎯 [FeaturedMatch] Fetching priority leagues fixtures for ${dateString}`);

    // Priority leagues for MyHomeFeaturedMatch (from MyNewFeaturedMatchList.ts)
    const priorityLeagueIds = [15, 38]; // FIFA Club World Cup, UEFA U21 Championship
    
    let allFixtures: any[] = [];

    for (const leagueId of priorityLeagueIds) {
      try {
        const fixtures = await rapidApiService.getFixturesByLeague(leagueId, 2025);
        
        // Filter fixtures for the requested date without any exclusions
        const dateFixtures = fixtures.filter((fixture: any) => {
          const fixtureDate = new Date(fixture.fixture.date);
          const fixtureDateString = fixtureDate.toISOString().split('T')[0];
          return fixtureDateString === dateString;
        });

        console.log(`🏆 [FeaturedMatch] League ${leagueId}: ${dateFixtures.length} fixtures for ${dateString}`);
        allFixtures.push(...dateFixtures);
      } catch (error) {
        console.error(`❌ [FeaturedMatch] Error fetching league ${leagueId}:`, error);
      }
    }

    console.log(`✅ [FeaturedMatch] Total priority fixtures: ${allFixtures.length}`);
    res.json(allFixtures);
  } catch (error) {
    console.error('❌ [FeaturedMatch] Error fetching priority leagues:', error);
    res.status(500).json({ message: "Failed to fetch priority league fixtures" });
  }
});

export default featuredMatchRouter;
