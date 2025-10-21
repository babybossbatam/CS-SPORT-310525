
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

    // Calculate date ranges for multiple timezones
    const targetDate = new Date(date + 'T00:00:00Z');
    const previousDay = new Date(targetDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Format dates for API calls
    const datesToFetch = [
      previousDay.toISOString().split('T')[0],
      date,
      nextDay.toISOString().split('T')[0]
    ];

    let allFixtures: any[] = [];

    // Fetch fixtures for each date to cover all timezones
    for (const fetchDate of datesToFetch) {
      try {
        const dateFixtures = await rapidApiService.getFixturesByDate(fetchDate, all === 'true');
        console.log(`📅 [FeaturedMatch] Got ${dateFixtures.length} fixtures for ${fetchDate} (NO FILTERING)`);
        allFixtures = [...allFixtures, ...dateFixtures];
      } catch (error) {
        console.error(`❌ [FeaturedMatch] Error fetching fixtures for ${fetchDate}:`, error);
        continue;
      }
    }

    // Remove duplicates based on fixture ID
    const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
    );

    console.log(`✅ [FeaturedMatch] Returning ${uniqueFixtures.length} unfiltered fixtures for ${date}`);
    return res.json(uniqueFixtures);
  } catch (error) {
    console.error('❌ [FeaturedMatch] Error fetching fixtures by date:', error);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

featuredMatchRouter.get("/leagues/:id/fixtures", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { skipFilter, season, date } = req.query;
    
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

    console.log(`🎯 [FeaturedMatch] Fetching league ${id} fixtures${date ? ` for date ${date}` : ''} with skipFilter=${skipFilter}`);

    // Use API-Football directly
    const allFixtures = await rapidApiService.getFixturesByLeague(id, seasonYear);
    
    // Filter by date if provided
    let fixtures = allFixtures;
    if (date) {
      const requestedDate = date as string;
      fixtures = allFixtures.filter((fixture: any) => {
        const fixtureDate = new Date(fixture.fixture.date);
        const fixtureDateString = fixtureDate.toISOString().split('T')[0];
        return fixtureDateString === requestedDate;
      });
      console.log(`✅ [FeaturedMatch] Filtered ${allFixtures.length} fixtures to ${fixtures.length} for date ${date}`);
    } else {
      console.log(`✅ [FeaturedMatch] Retrieved ${fixtures ? fixtures.length : 0} fixtures for league ${id} (NO DATE FILTER)`);
    }

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
