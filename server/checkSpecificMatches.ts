
import { rapidApiService } from './services/rapidApi';

async function checkSpecificMatches() {
  console.log('🔍 Checking for Al Ahly vs Inter Miami and UEFA U21 matches...\n');

  // Check multiple dates around June 16, 2025
  const testDates = ['2025-06-15', '2025-06-16', '2025-06-17'];

  for (const date of testDates) {
    console.log(`\n📅 Checking date: ${date}`);
    console.log('='.repeat(50));

    try {
      const fixtures = await rapidApiService.getFixturesByDate(date, true);
      console.log(`Total fixtures found: ${fixtures.length}`);

      // Search for Al Ahly vs Inter Miami
      const alAhlyMatches = fixtures.filter(fixture => 
        (fixture.teams.home.name.toLowerCase().includes('al ahly') && 
         fixture.teams.away.name.toLowerCase().includes('inter miami')) ||
        (fixture.teams.home.name.toLowerCase().includes('inter miami') && 
         fixture.teams.away.name.toLowerCase().includes('al ahly'))
      );

      if (alAhlyMatches.length > 0) {
        console.log('\n✅ Al Ahly vs Inter Miami matches found:');
        alAhlyMatches.forEach(match => {
          console.log(`  - ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`    League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`    Country: ${match.league.country}`);
          console.log(`    Date: ${match.fixture.date}`);
          console.log(`    Status: ${match.fixture.status.long}`);
        });
      }

      // Search for U21 matches
      const u21Matches = fixtures.filter(fixture => 
        fixture.league.name.toLowerCase().includes('u21') ||
        fixture.teams.home.name.toLowerCase().includes('u21') ||
        fixture.teams.away.name.toLowerCase().includes('u21')
      );

      if (u21Matches.length > 0) {
        console.log('\n✅ U21 matches found:');
        u21Matches.forEach(match => {
          console.log(`  - ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`    League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`    Country: ${match.league.country}`);
          console.log(`    Date: ${match.fixture.date}`);
        });
      }

      // Search for UEFA competitions
      const uefaMatches = fixtures.filter(fixture => 
        fixture.league.name.toLowerCase().includes('uefa') ||
        fixture.league.name.toLowerCase().includes('euro')
      );

      if (uefaMatches.length > 0) {
        console.log('\n✅ UEFA/Euro matches found:');
        uefaMatches.forEach(match => {
          console.log(`  - ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`    League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`    Date: ${match.fixture.date}`);
        });
      }

      // Search for FIFA Club World Cup
      const fifaMatches = fixtures.filter(fixture => 
        fixture.league.name.toLowerCase().includes('fifa') ||
        fixture.league.name.toLowerCase().includes('club world cup')
      );

      if (fifaMatches.length > 0) {
        console.log('\n✅ FIFA Club World Cup matches found:');
        fifaMatches.forEach(match => {
          console.log(`  - ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`    League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`    Date: ${match.fixture.date}`);
        });
      }

      if (alAhlyMatches.length === 0 && u21Matches.length === 0 && uefaMatches.length === 0 && fifaMatches.length === 0) {
        console.log('❌ No specific matches found for this date');
      }

    } catch (error) {
      console.error(`❌ Error checking date ${date}:`, error);
    }
  }

  // Also check what World competitions are available
  console.log('\n\n🌍 Checking all World competitions...');
  try {
    const allLeagues = await rapidApiService.getLeagues();
    const worldLeagues = allLeagues.filter(league => 
      league.country.name === 'World' || league.country.name.toLowerCase() === 'world'
    );

    console.log(`Found ${worldLeagues.length} World competitions:`);
    worldLeagues.forEach(league => {
      console.log(`- ${league.league.name} (ID: ${league.league.id})`);
    });
  } catch (error) {
    console.error('❌ Error getting leagues:', error);
  }
}

// Run the check
checkSpecificMatches().catch(console.error);
