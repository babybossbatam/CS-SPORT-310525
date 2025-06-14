
import { rapidApiService } from './services/rapidApi';

async function checkFifaClubWorldCup() {
  console.log('=== FIFA Club World Cup Fixture Analysis ===\n');

  try {
    // Check FIFA Club World Cup (League ID: 15)
    console.log('1. FIFA Club World Cup League Info:');
    const leagueInfo = await rapidApiService.getLeagueById(15);
    if (leagueInfo) {
      console.log(`✅ League Name: ${leagueInfo.league.name}`);
      console.log(`✅ Country: ${leagueInfo.country.name}`);
      console.log(`✅ League Type: ${leagueInfo.league.type}`);
      
      if (leagueInfo.seasons) {
        console.log(`✅ Available seasons: ${leagueInfo.seasons.map(s => s.year).join(', ')}`);
        const currentSeason = leagueInfo.seasons.find(s => s.current);
        if (currentSeason) {
          console.log(`✅ Current season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`);
        }
      }
    }

    console.log('\n2. FIFA Club World Cup Fixtures for 2025:');
    const fixtures = await rapidApiService.getFixturesByLeague(15, 2025);
    console.log(`Found ${fixtures.length} fixtures for FIFA Club World Cup 2025\n`);

    if (fixtures.length > 0) {
      console.log('All FIFA Club World Cup fixtures:');
      fixtures.forEach((fixture, index) => {
        const date = new Date(fixture.fixture.date).toLocaleString();
        console.log(`\n${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`   Date: ${date}`);
        console.log(`   Status: ${fixture.fixture.status.long} (${fixture.fixture.status.short})`);
        console.log(`   Venue: ${fixture.fixture.venue?.name || 'TBD'}`);
        console.log(`   Round: ${fixture.league.round || 'N/A'}`);
        if (fixture.goals.home !== null && fixture.goals.away !== null) {
          console.log(`   Score: ${fixture.goals.home} - ${fixture.goals.away}`);
        }
      });

      // Check for Al Ahly vs Inter Miami specifically
      console.log('\n3. Looking for Al Ahly vs Inter Miami match:');
      const alAhlyInterMiami = fixtures.find(fixture => 
        (fixture.teams.home.name.toLowerCase().includes('al ahly') && 
         fixture.teams.away.name.toLowerCase().includes('inter miami')) ||
        (fixture.teams.away.name.toLowerCase().includes('al ahly') && 
         fixture.teams.home.name.toLowerCase().includes('inter miami'))
      );

      if (alAhlyInterMiami) {
        console.log(`✅ Found Al Ahly vs Inter Miami match:`);
        console.log(`   ${alAhlyInterMiami.teams.home.name} vs ${alAhlyInterMiami.teams.away.name}`);
        console.log(`   Date: ${new Date(alAhlyInterMiami.fixture.date).toLocaleString()}`);
        console.log(`   Status: ${alAhlyInterMiami.fixture.status.long}`);
      } else {
        console.log(`❌ Al Ahly vs Inter Miami match not found in fixtures`);
        
        // Show teams that ARE in the fixtures
        const teams = new Set();
        fixtures.forEach(fixture => {
          teams.add(fixture.teams.home.name);
          teams.add(fixture.teams.away.name);
        });
        console.log(`\nTeams found in FIFA Club World Cup fixtures:`);
        Array.from(teams).forEach(team => console.log(`   - ${team}`));
      }
    }

    console.log('\n4. Checking standings:');
    const standings = await rapidApiService.getLeagueStandings(15, 2025);
    if (standings && standings.length > 0) {
      console.log(`Found standings with ${standings.length} groups/standings`);
      standings.forEach((standing, index) => {
        console.log(`\nGroup/Standing ${index + 1}:`);
        if (standing.standings && standing.standings.length > 0) {
          standing.standings[0].forEach((team, teamIndex) => {
            console.log(`   ${teamIndex + 1}. ${team.team.name} - Points: ${team.points}`);
          });
        }
      });
    } else {
      console.log('❌ No standings found');
    }

  } catch (error) {
    console.error('❌ Error checking FIFA Club World Cup:', error);
  }

  console.log('\n✅ FIFA Club World Cup Analysis Complete!');
}

// Run the check
checkFifaClubWorldCup().then(() => {
  console.log('\n🏁 Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
