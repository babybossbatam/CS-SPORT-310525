import sportsradarApi from './services/sportsradarApi';

// Simple test function to test SportsRadar API
async function testSportsradarApi() {
  try {
    console.log('Testing SportsRadar API...');
    
    // Test getting all sports
    console.log('1. Getting all sports...');
    const sports = await sportsradarApi.getAllSports();
    console.log(`Found ${sports?.length || 0} sports`);
    
    if (!sports || !Array.isArray(sports)) {
      console.error('Sports data is not an array:', sports);
      return;
    }
    
    // Log all sports to see what we have
    console.log('Available sports:');
    sports.forEach((sport: any) => {
      console.log(`- ${sport.sportName || sport.name} (ID: ${sport.sportId || sport.id})`);
    });
    
    // Find soccer specifically
    const soccer = sports.find((sport: any) => {
      const name = (sport.sportName || sport.name || '').toLowerCase();
      return name.includes('soccer');
    });
    
    if (!soccer) {
      console.error('Soccer not found in sports list');
      return;
    }
    
    const soccerId = soccer.sportId || soccer.id;
    console.log(`Found soccer with ID: ${soccerId}`);
    
    // Test getting football leagues
    console.log('2. Getting football leagues...');
    const leagues = await sportsradarApi.getFootballLeagues();
    console.log(`Found ${leagues?.length || 0} football leagues`);
    
    if (!leagues || !Array.isArray(leagues)) {
      console.error('Leagues data is not an array:', leagues);
      return;
    }
    
    // Display first 5 leagues
    console.log('First 5 leagues:');
    leagues.slice(0, 5).forEach((league: any) => {
      console.log(`- ${league.name || league.tournamentName} (ID: ${league.id || league.tournamentId})`);
    });
    
    // Test getting fixtures for a league
    if (leagues.length > 0) {
      const league = leagues[0];
      const leagueId = league.id || league.tournamentId;
      console.log(`3. Getting fixtures for league ${leagueId}...`);
      try {
        const fixtures = await sportsradarApi.getFixturesByLeague(leagueId);
        console.log(`Found ${fixtures?.length || 0} fixtures`);
        
        if (fixtures && Array.isArray(fixtures) && fixtures.length > 0) {
          // Display the first fixture data structure to understand the format
          console.log('First fixture data structure:', JSON.stringify(fixtures[0], null, 2));
          
          // Test mapping a fixture
          console.log('4. Testing fixture mapping...');
          const mappedFixture = sportsradarApi.mapSportsradarFixtureToInternal(fixtures[0]);
          console.log('Mapped fixture:', JSON.stringify(mappedFixture, null, 2));
        } else {
          console.log('No fixtures found for this league');
        }
      } catch (error) {
        console.error(`Error getting fixtures for league ${leagueId}:`, error);
      }
    }
    
    // Test getting fixtures by date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`5. Getting fixtures for date ${today}...`);
    try {
      const todayFixtures = await sportsradarApi.getFixturesByDate(today);
      console.log(`Found ${todayFixtures?.length || 0} fixtures for today`);
      
      if (todayFixtures && Array.isArray(todayFixtures) && todayFixtures.length > 0) {
        // Show a sample of match data structure
        console.log('Sample fixture from today:', JSON.stringify(todayFixtures[0], null, 2));
      }
    } catch (error) {
      console.error(`Error getting fixtures for date ${today}:`, error);
    }
    
    // Test getting live fixtures
    console.log('6. Getting live fixtures...');
    try {
      const liveFixtures = await sportsradarApi.getLiveFixtures();
      console.log(`Found ${liveFixtures?.length || 0} live fixtures`);
      
      if (liveFixtures && Array.isArray(liveFixtures) && liveFixtures.length > 0) {
        // Show a sample of live match data structure
        console.log('Sample live fixture:', JSON.stringify(liveFixtures[0], null, 2));
      }
    } catch (error) {
      console.error('Error getting live fixtures:', error);
    }
    
    // Test getting league details and standings
    if (leagues.length > 0) {
      const league = leagues[0];
      const leagueId = league.id || league.tournamentId;
      console.log(`7. Getting details for league ${leagueId}...`);
      
      try {
        const leagueDetails = await sportsradarApi.getLeagueDetails(leagueId);
        console.log('League details:', JSON.stringify(leagueDetails, null, 2));
      } catch (error) {
        console.error(`Error getting details for league ${leagueId}:`, error);
      }
      
      console.log(`8. Getting standings for league ${leagueId}...`);
      try {
        const standings = await sportsradarApi.getStandings(leagueId);
        console.log('Standings:', JSON.stringify(standings, null, 2));
      } catch (error) {
        console.error(`Error getting standings for league ${leagueId}:`, error);
      }
    }
    
    console.log('SportsRadar API test completed successfully!');
  } catch (error) {
    console.error('Error testing SportsRadar API:', error);
  }
}

// Run the test
testSportsradarApi();