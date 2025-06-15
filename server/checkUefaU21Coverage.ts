
import { rapidApiService } from './services/rapidApi';

async function checkUefaU21Coverage() {
  console.log('🔍 Checking UEFA U21 Championship Coverage...\n');

  try {
    // 1. Check if UEFA U21 Championship league exists (ID: 38)
    console.log('1. Checking UEFA U21 Championship league info...');
    const league = await rapidApiService.getLeagueById(38);
    if (league) {
      console.log(`✅ League found: ${league.league.name} (ID: ${league.league.id})`);
      console.log(`   Country: ${league.country.name}`);
      console.log(`   Current season: ${league.seasons?.find(s => s.current)?.year || 'N/A'}`);
    } else {
      console.log('❌ UEFA U21 Championship league not found');
      return;
    }

    // 2. Check fixtures for current season
    console.log('\n2. Checking UEFA U21 Championship fixtures...');
    const fixtures = await rapidApiService.getFixturesByLeague(38, 2025);
    console.log(`✅ Found ${fixtures.length} fixtures for UEFA U21 Championship`);

    if (fixtures.length > 0) {
      console.log('\n📅 Recent/upcoming matches:');
      fixtures.slice(0, 5).forEach(match => {
        console.log(`   ${match.teams.home.name} vs ${match.teams.away.name}`);
        console.log(`   Date: ${match.fixture.date}, Status: ${match.fixture.status.short}`);
      });
    }

    // 3. Check today's fixtures for U21 matches
    console.log('\n3. Checking today\'s fixtures for U21 matches...');
    const today = new Date().toISOString().split('T')[0];
    const todayFixtures = await rapidApiService.getFixturesByDate(today, true);
    
    const u21TodayMatches = todayFixtures.filter(match => 
      match.league.name.toLowerCase().includes('u21') ||
      match.league.name.toLowerCase().includes('under-21') ||
      match.league.id === 38
    );

    console.log(`✅ Found ${u21TodayMatches.length} U21 matches today`);
    u21TodayMatches.forEach(match => {
      console.log(`   ${match.teams.home.name} vs ${match.teams.away.name}`);
      console.log(`   League: ${match.league.name}, Status: ${match.fixture.status.short}`);
    });

    // 4. Check if matches from your images are covered
    console.log('\n4. Checking specific matches from images...');
    const testMatches = [
      { home: 'Spain U21', away: 'Romania U21' },
      { home: 'France U21', away: 'Georgia U21' },
      { home: 'Portugal U21', away: 'Poland U21' },
      { home: 'Slovakia U21', away: 'Italy U21' }
    ];

    for (const testMatch of testMatches) {
      const found = fixtures.find(fixture => 
        (fixture.teams.home.name.toLowerCase().includes(testMatch.home.toLowerCase().replace(' u21', '')) &&
         fixture.teams.away.name.toLowerCase().includes(testMatch.away.toLowerCase().replace(' u21', ''))) ||
        (fixture.teams.home.name.toLowerCase().includes(testMatch.home.toLowerCase()) &&
         fixture.teams.away.name.toLowerCase().includes(testMatch.away.toLowerCase()))
      );

      if (found) {
        console.log(`✅ Found: ${testMatch.home} vs ${testMatch.away}`);
        console.log(`   API: ${found.teams.home.name} vs ${found.teams.away.name}`);
        console.log(`   Date: ${found.fixture.date}, Status: ${found.fixture.status.short}`);
      } else {
        console.log(`❌ Not found: ${testMatch.home} vs ${testMatch.away}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking UEFA U21 coverage:', error);
  }
}

// Run the check
checkUefaU21Coverage();
