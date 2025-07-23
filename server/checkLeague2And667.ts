
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays } from 'date-fns';

async function checkLeagues2And667() {
  console.log('🚀 Starting League Check for IDs 2 and 667...');
  
  const targetLeagues = [
    { id: 2, name: 'UEFA Champions League' },
    { id: 667, name: 'Premier League Asia Trophy' }
  ];

  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);
  
  const dates = [
    format(yesterday, "yyyy-MM-dd"),
    format(today, "yyyy-MM-dd"),
    format(tomorrow, "yyyy-MM-dd")
  ];

  console.log(`📅 Checking dates: ${dates.join(', ')}\n`);

  for (const league of targetLeagues) {
    console.log('═'.repeat(80));
    console.log(`🏆 CHECKING LEAGUE: ${league.name} (ID: ${league.id})`);
    console.log('═'.repeat(80));

    try {
      // First, get league information
      const leagueInfo = await rapidApiService.getLeagueById(league.id);
      
      if (!leagueInfo) {
        console.log(`❌ League ${league.id} not found in API`);
        continue;
      }

      console.log(`✅ League found: ${leagueInfo.league.name}`);
      console.log(`🌍 Country: ${leagueInfo.league.country}`);
      console.log(`🏆 Type: ${leagueInfo.league.type}`);
      
      if (leagueInfo.seasons && leagueInfo.seasons.length > 0) {
        const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[leagueInfo.seasons.length - 1];
        console.log(`📊 Current season: ${currentSeason.year}`);
        console.log(`📅 Season period: ${currentSeason.start} to ${currentSeason.end}`);
        console.log(`🔴 Coverage includes: fixtures=${currentSeason.coverage.fixtures}, standings=${currentSeason.coverage.standings}, players=${currentSeason.coverage.players}, top_scorers=${currentSeason.coverage.top_scorers}`);
      }

      // Check fixtures by league for current season
      console.log(`\n🔍 Fetching all fixtures for league ${league.id}...`);
      const leagueFixtures = await rapidApiService.getFixturesByLeague(league.id, 2024);
      console.log(`📊 Total fixtures in league: ${leagueFixtures.length}`);

      if (leagueFixtures.length > 0) {
        // Group by status
        const fixturesByStatus = leagueFixtures.reduce((acc, fixture) => {
          const status = fixture.fixture.status.short;
          if (!acc[status]) acc[status] = [];
          acc[status].push(fixture);
          return acc;
        }, {} as any);

        console.log(`\n📈 Fixtures by status:`);
        Object.entries(fixturesByStatus).forEach(([status, fixtures]: [string, any[]]) => {
          console.log(`   ${status}: ${fixtures.length} matches`);
        });

        // Show recent matches (last 10)
        const recentMatches = leagueFixtures
          .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
          .slice(0, 10);

        console.log(`\n🕒 Most recent 10 matches:`);
        recentMatches.forEach((fixture, index) => {
          const date = new Date(fixture.fixture.date);
          const homeTeam = fixture.teams.home.name;
          const awayTeam = fixture.teams.away.name;
          const status = fixture.fixture.status.short;
          const score = fixture.goals.home !== null && fixture.goals.away !== null 
            ? `${fixture.goals.home}-${fixture.goals.away}` 
            : 'vs';
          
          console.log(`   ${index + 1}. ${homeTeam} ${score} ${awayTeam}`);
          console.log(`      📅 ${date.toISOString().split('T')[0]} ${date.toLocaleTimeString()} | Status: ${status}`);
          console.log(`      🆔 Fixture ID: ${fixture.fixture.id}`);
          console.log('');
        });
      }

      // Check fixtures for specific dates
      console.log(`\n🔍 Checking fixtures for specific dates...`);
      for (const date of dates) {
        console.log(`\n📅 Date: ${date}`);
        
        try {
          const dateFixtures = await rapidApiService.getFixturesByDate(date, true);
          const leagueMatches = dateFixtures.filter(fixture => fixture.league.id === league.id);
          
          console.log(`   📊 Total matches on ${date}: ${dateFixtures.length}`);
          console.log(`   🎯 Matches for league ${league.id}: ${leagueMatches.length}`);
          
          if (leagueMatches.length > 0) {
            leagueMatches.forEach((fixture, index) => {
              const homeTeam = fixture.teams.home.name;
              const awayTeam = fixture.teams.away.name;
              const status = fixture.fixture.status.short;
              const score = fixture.goals.home !== null && fixture.goals.away !== null 
                ? `${fixture.goals.home}-${fixture.goals.away}` 
                : 'vs';
              
              console.log(`     ${index + 1}. ${homeTeam} ${score} ${awayTeam} (${status})`);
              console.log(`        🆔 Fixture ID: ${fixture.fixture.id}`);
            });
          }
        } catch (error) {
          console.error(`   ❌ Error fetching fixtures for ${date}:`, error);
        }
      }

      // Check live fixtures
      console.log(`\n🔴 Checking live fixtures...`);
      try {
        const liveFixtures = await rapidApiService.getLiveFixtures();
        const liveleagueMatches = liveFixtures.filter(fixture => fixture.league.id === league.id);
        
        console.log(`   📊 Total live matches: ${liveFixtures.length}`);
        console.log(`   🎯 Live matches for league ${league.id}: ${liveleagueMatches.length}`);
        
        if (liveleagueMatches.length > 0) {
          liveleagueMatches.forEach((fixture, index) => {
            const homeTeam = fixture.teams.home.name;
            const awayTeam = fixture.teams.away.name;
            const status = fixture.fixture.status.short;
            const elapsed = fixture.fixture.status.elapsed;
            const score = `${fixture.goals.home}-${fixture.goals.away}`;
            
            console.log(`     ${index + 1}. ${homeTeam} ${score} ${awayTeam}`);
            console.log(`        🔴 Status: ${status}${elapsed ? ` (${elapsed}')` : ''}`);
            console.log(`        🆔 Fixture ID: ${fixture.fixture.id}`);
          });
        }
      } catch (error) {
        console.error(`   ❌ Error fetching live fixtures:`, error);
      }

    } catch (error) {
      console.error(`❌ Error checking league ${league.id}:`, error);
    }

    console.log(''); // Empty line between leagues
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));
  console.log(`🎯 Leagues checked: ${targetLeagues.length}`);
  console.log(`📅 Dates checked: ${dates.length} (${dates.join(', ')})`);
  console.log('✅ Analysis completed!');
}

// Run the script
async function main() {
  await checkLeagues2And667();
  console.log('\n✅ League 2 & 667 analysis completed!');
}

main().catch(console.error);
