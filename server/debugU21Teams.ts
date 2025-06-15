
import { rapidApiService } from './services/rapidApi';

async function debugU21TeamNames() {
  console.log('🔍 Finding the correct League ID for UEFA U21 Championship...\n');

  try {
    // First, let's find all leagues that might be U21 related
    console.log('1. Searching for U21-related leagues...');
    const allLeagues = await rapidApiService.getLeagues();
    
    const u21Leagues = allLeagues.filter(league => 
      league.league.name.toLowerCase().includes('u21') ||
      league.league.name.toLowerCase().includes('under 21') ||
      league.league.name.toLowerCase().includes('under-21')
    );

    console.log(`Found ${u21Leagues.length} U21-related leagues:`);
    u21Leagues.forEach(league => {
      console.log(`   ID: ${league.league.id} - ${league.league.name} (${league.country?.name || 'No country'})`);
    });

    // Also check for European championships
    const euroLeagues = allLeagues.filter(league => 
      (league.league.name.toLowerCase().includes('euro') && 
       league.league.name.toLowerCase().includes('u21')) ||
      (league.league.name.toLowerCase().includes('uefa') && 
       league.league.name.toLowerCase().includes('u21'))
    );

    console.log(`\nFound ${euroLeagues.length} UEFA/Euro U21 leagues:`);
    euroLeagues.forEach(league => {
      console.log(`   ID: ${league.league.id} - ${league.league.name} (${league.country?.name || 'No country'})`);
    });

    // Let's also check what League ID 8 actually is
    console.log('\n2. Checking what League ID 8 actually is...');
    const league8 = await rapidApiService.getLeagueById(8);
    if (league8) {
      console.log(`League ID 8: ${league8.league.name} (Country: ${league8.country?.name || 'No country'})`);
    }

    // Now try to get fixtures from actual U21 leagues if we found any
    if (u21Leagues.length > 0 || euroLeagues.length > 0) {
      const targetLeagues = [...u21Leagues, ...euroLeagues];
      
      for (const league of targetLeagues) {
        console.log(`\n3. Checking fixtures for ${league.league.name} (ID: ${league.league.id})...`);
        const fixtures = await rapidApiService.getFixturesByLeague(league.league.id, 2025);
    
    console.log(`Found ${fixtures.length} fixtures for ${league.league.name}\n`);

        if (fixtures.length > 0) {
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

          // Show recent fixtures
          const sortedDates = Object.keys(fixturesByDate).sort();
          const recentDates = sortedDates.slice(-5); // Show last 5 dates
          
          recentDates.forEach(date => {
            console.log(`📅 ${date}:`);
            fixturesByDate[date].slice(0, 3).forEach((match, index) => {
              console.log(`   ${index + 1}. ${match.home} vs ${match.away} (${match.status})`);
            });
          });

          // Look for specific teams
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
        }
      }
    } else {
      console.log('\n❌ No U21 leagues found in the API');
    }

  } catch (error) {
    console.error('Error debugging U21 teams:', error);
  }
}

debugU21TeamNames();
