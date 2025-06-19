
import { rapidApiService } from './services/rapidApi';
import sportsradarApi from './services/sportsradarApi';
import { betsApiService } from './services/betsApi';

async function testFifaData() {
  console.log('=== Testing FIFA Data from All APIs ===\n');

  // Test API-Football (RapidAPI)
  console.log('1. API-Football (RapidAPI):');
  try {
    // Test FIFA Club World Cup (ID: 15)
    const fifaClubWorldCup = await rapidApiService.getLeagueById(15);
    console.log('✅ FIFA Club World Cup:', fifaClubWorldCup?.league?.name || 'Not found');
    
    // Test FIFA World Cup (ID: 1)
    const fifaWorldCup = await rapidApiService.getLeagueById(1);
    console.log('✅ FIFA World Cup:', fifaWorldCup?.league?.name || 'Not found');
    
    // Get fixtures for FIFA Club World Cup
    const fifaFixtures = await rapidApiService.getFixturesByLeague(15, 2024);
    console.log(`✅ FIFA Club World Cup fixtures: ${fifaFixtures.length} matches found\n`);
    
  } catch (error) {
    console.log('❌ API-Football error:', error.message, '\n');
  }

  // Test SportsRadar
  console.log('2. SportsRadar:');
  try {
    const leagues = await sportsradarApi.getFootballLeagues();
    const fifaLeagues = leagues.filter(league => 
      league.name?.toLowerCase().includes('fifa') || 
      league.name?.toLowerCase().includes('world cup')
    );
    console.log(`✅ FIFA-related leagues found: ${fifaLeagues.length}`);
    fifaLeagues.forEach(league => console.log(`   - ${league.name}`));
    console.log('');
  } catch (error) {
    console.log('❌ SportsRadar error:', error.message, '\n');
  }

  // Test BetsAPI
  console.log('3. BetsAPI:');
  try {
    const news = await betsApiService.getFootballNews(1, 5);
    const fifaNews = news.filter(article => 
      article.title?.toLowerCase().includes('fifa') ||
      article.title?.toLowerCase().includes('world cup')
    );
    console.log(`✅ FIFA-related news found: ${fifaNews.length} articles`);
    fifaNews.forEach(article => console.log(`   - ${article.title}`));
    console.log('');
  } catch (error) {
    console.log('❌ BetsAPI error:', error.message, '\n');
  }

  console.log('=== Test Complete ===');
}

// Run the test
testFifaData().catch(console.error);
