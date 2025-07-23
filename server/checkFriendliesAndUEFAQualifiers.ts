
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays } from 'date-fns';

async function checkFriendliesAndUEFAQualifiers() {
  console.log('🚀 Starting Friendlies and UEFA Qualifiers Check...');
  
  const targetLeagues = [
    { id: 667, name: 'Club Friendlies' },
    { id: 2, name: 'UEFA Champions League' },
    { id: 848, name: 'UEFA Conference League' }, // Often has qualifiers
    { id: 3, name: 'UEFA Europa League' }, // Often has qualifiers
    { id: 886, name: 'UEFA Champions League Qualifiers' }, // Specific qualifier league
    { id: 908, name: 'UEFA Europa League Qualifiers' } // Specific qualifier league
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
              const round = fixture.league.round || 'Regular';
              
              console.log(`     ${index + 1}. ${homeTeam} ${score} ${awayTeam} (${status})`);
              console.log(`        🏆 Round: ${round}`);
              console.log(`        🆔 Fixture ID: ${fixture.fixture.id}`);
              console.log(`        📅 Date: ${fixture.fixture.date}`);
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
        const liveLeagueMatches = liveFixtures.filter(fixture => fixture.league.id === league.id);
        
        console.log(`   📊 Total live matches: ${liveFixtures.length}`);
        console.log(`   🎯 Live matches for league ${league.id}: ${liveLeagueMatches.length}`);
        
        if (liveLeagueMatches.length > 0) {
          liveLeagueMatches.forEach((fixture, index) => {
            const homeTeam = fixture.teams.home.name;
            const awayTeam = fixture.teams.away.name;
            const status = fixture.fixture.status.short;
            const elapsed = fixture.fixture.status.elapsed;
            const score = `${fixture.goals.home}-${fixture.goals.away}`;
            const round = fixture.league.round || 'Regular';
            
            console.log(`     ${index + 1}. ${homeTeam} ${score} ${awayTeam}`);
            console.log(`        🔴 Status: ${status}${elapsed ? ` (${elapsed}')` : ''}`);
            console.log(`        🏆 Round: ${round}`);
            console.log(`        🆔 Fixture ID: ${fixture.fixture.id}`);
          });
        }
      } catch (error) {
        console.error(`   ❌ Error fetching live fixtures:`, error);
      }

      // Get league season info
      try {
        const leagueInfo = await rapidApiService.getLeagueById(league.id);
        if (leagueInfo && leagueInfo.seasons) {
          const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[leagueInfo.seasons.length - 1];
          console.log(`\n📊 Current season: ${currentSeason.year}`);
          console.log(`📅 Season period: ${currentSeason.start} to ${currentSeason.end}`);
        }
      } catch (error) {
        console.error(`   ❌ Error fetching league info:`, error);
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
  await checkFriendliesAndUEFAQualifiers();
  console.log('\n✅ Friendlies and UEFA Qualifiers analysis completed!');
}

main().catch(console.error);
