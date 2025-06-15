
import { rapidApiService } from './services/rapidApi';

async function debugU21TeamNames() {
  console.log('🔍 Debugging UEFA U21 Championship team names...\n');

  try {
    // Get all UEFA U21 fixtures
    const fixtures = await rapidApiService.getFixturesByLeague(8, 2025);
    
    console.log(`Found ${fixtures.length} UEFA U21 fixtures total\n`);

    // Group fixtures by date and show team names
    const fixturesByDate = {};
    
    fixtures.forEach(fixture => {
      const date = fixture.fixture.date.split('T')[0];
      if (!fixturesByDate[date]) {
        fixturesByDate[date] = [];
      }
      fixturesByDate[date].push({
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        status: fixture.fixture.status.short,
        time: fixture.fixture.date
      });
    });

    // Show fixtures organized by date
    Object.keys(fixturesByDate).sort().forEach(date => {
      console.log(`📅 ${date}:`);
      fixturesByDate[date].forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.home} vs ${match.away} (${match.status})`);
      });
      console.log('');
    });

    // Look for specific patterns
    console.log('🔍 Looking for Spain, Romania, France, Georgia, Portugal, Poland, Slovakia, Italy...\n');
    
    const searchTeams = ['Spain', 'Romania', 'France', 'Georgia', 'Portugal', 'Poland', 'Slovakia', 'Italy'];
    
    fixtures.forEach(fixture => {
      const homeTeam = fixture.teams.home.name;
      const awayTeam = fixture.teams.away.name;
      
      searchTeams.forEach(team => {
        if (homeTeam.includes(team) || awayTeam.includes(team)) {
          console.log(`🎯 Found ${team}: ${homeTeam} vs ${awayTeam} on ${fixture.fixture.date.split('T')[0]}`);
        }
      });
    });

  } catch (error) {
    console.error('Error debugging U21 teams:', error);
  }
}

debugU21TeamNames();
