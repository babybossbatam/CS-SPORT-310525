import sportsradarApi from './services/sportsradarApi';

// Simple test function to test SportsRadar API
async function testSportsradarApi() {
  try {
    console.log('Testing SportsRadar API...');
    
    // Test getting all sports
    console.log('1. Getting all sports...');
    const sports = await sportsradarApi.getAllSports();
    console.log(`Found ${sports.length} sports`);
    
    // Find football/soccer
    const football = sports.find((sport: any) => 
      sport.name.toLowerCase() === 'football' || sport.name.toLowerCase() === 'soccer'
    );
    
    if (!football) {
      console.error('Football/Soccer not found in sports list');
      return;
    }
    
    console.log(`Found football with ID: ${football.id}`);
    
    // Test getting football leagues
    console.log('2. Getting football leagues...');
    const leagues = await sportsradarApi.getFootballLeagues();
    console.log(`Found ${leagues.length} football leagues`);
    
    // Display first 5 leagues
    console.log('First 5 leagues:');
    leagues.slice(0, 5).forEach((league: any) => {
      console.log(`- ${league.name} (ID: ${league.id})`);
    });
    
    // Test getting fixtures for a league
    if (leagues.length > 0) {
      const leagueId = leagues[0].id;
      console.log(`3. Getting fixtures for league ${leagueId}...`);
      const fixtures = await sportsradarApi.getFixturesByLeague(leagueId);
      console.log(`Found ${fixtures.length} fixtures`);
      
      // Test mapping a fixture
      if (fixtures.length > 0) {
        console.log('4. Testing fixture mapping...');
        const mappedFixture = sportsradarApi.mapSportsradarFixtureToInternal(fixtures[0]);
        console.log('Mapped fixture:', JSON.stringify(mappedFixture, null, 2));
      }
    }
    
    // Test getting fixtures by date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`5. Getting fixtures for date ${today}...`);
    const todayFixtures = await sportsradarApi.getFixturesByDate(today);
    console.log(`Found ${todayFixtures.length} fixtures for today`);
    
    // Test getting live fixtures
    console.log('6. Getting live fixtures...');
    const liveFixtures = await sportsradarApi.getLiveFixtures();
    console.log(`Found ${liveFixtures.length} live fixtures`);
    
    console.log('SportsRadar API test completed successfully!');
  } catch (error) {
    console.error('Error testing SportsRadar API:', error);
  }
}

// Run the test
testSportsradarApi();