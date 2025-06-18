
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays } from 'date-fns';

async function checkLeagues38and15() {
  console.log('🔍 Checking fixtures for League ID 38 and 15...\n');
  
  const today = new Date();
  const dates = [
    subDays(today, 1).toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    addDays(today, 1).toISOString().split('T')[0],
    addDays(today, 2).toISOString().split('T')[0],
  ];

  console.log(`📅 Checking dates: ${dates.join(', ')}\n`);

  // League 38 - Premier League
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 === LEAGUE 38 (Premier League) ===');
  for (const date of dates) {
    try {
      console.log(`\n📊 Checking League 38 for ${date}:`);
      const fixtures38 = await rapidApiService.getFixturesByDate(date, undefined, 38);
      
      if (fixtures38 && fixtures38.length > 0) {
        console.log(`✅ Found ${fixtures38.length} fixtures for League 38 on ${date}:`);
        fixtures38.forEach((fixture: any, index: number) => {
          console.log(`  ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
          console.log(`     Status: ${fixture.fixture?.status?.short} | Date: ${fixture.fixture?.date}`);
          console.log(`     League: ${fixture.league?.name} (${fixture.league?.country})`);
        });
      } else {
        console.log(`❌ No fixtures found for League 38 on ${date}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching League 38 for ${date}:`, error);
    }
  }

  // League 15 - FIFA Club World Cup
  console.log('\n\n🌍 === LEAGUE 15 (FIFA Club World Cup) ===');
  for (const date of dates) {
    try {
      console.log(`\n📊 Checking League 15 for ${date}:`);
      const fixtures15 = await rapidApiService.getFixturesByDate(date, undefined, 15);
      
      if (fixtures15 && fixtures15.length > 0) {
        console.log(`✅ Found ${fixtures15.length} fixtures for League 15 on ${date}:`);
        fixtures15.forEach((fixture: any, index: number) => {
          console.log(`  ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
          console.log(`     Status: ${fixture.fixture?.status?.short} | Date: ${fixture.fixture?.date}`);
          console.log(`     League: ${fixture.league?.name} (${fixture.league?.country})`);
          console.log(`     Venue: ${fixture.fixture?.venue?.name || 'Unknown'}`);
          console.log(`     Goals: ${fixture.goals?.home || 0} - ${fixture.goals?.away || 0}`);
        });
      } else {
        console.log(`❌ No fixtures found for League 15 on ${date}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching League 15 for ${date}:`, error);
    }
  }

  // Check current season for FIFA Club World Cup
  console.log('\n\n🔍 === CHECKING FIFA CLUB WORLD CUP SEASON INFO ===');
  try {
    const currentYear = new Date().getFullYear();
    console.log(`Current year: ${currentYear}`);
    
    // Check if there are any fixtures for the current season
    const seasonFixtures = await rapidApiService.getFixturesByLeague(15, currentYear);
    if (seasonFixtures && seasonFixtures.length > 0) {
      console.log(`\n✅ Found ${seasonFixtures.length} total fixtures for League 15 in ${currentYear} season:`);
      
      // Group by status
      const statusGroups = seasonFixtures.reduce((acc: any, fixture: any) => {
        const status = fixture.fixture?.status?.short || 'UNKNOWN';
        if (!acc[status]) acc[status] = [];
        acc[status].push(fixture);
        return acc;
      }, {});

      Object.entries(statusGroups).forEach(([status, fixtures]: [string, any]) => {
        console.log(`\n  📌 Status "${status}": ${fixtures.length} matches`);
        fixtures.slice(0, 3).forEach((fixture: any, index: number) => {
          console.log(`    ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
          console.log(`       Date: ${fixture.fixture?.date} | Venue: ${fixture.fixture?.venue?.name || 'Unknown'}`);
        });
        if (fixtures.length > 3) {
          console.log(`    ... and ${fixtures.length - 3} more matches`);
        }
      });

      // Check dates distribution
      console.log('\n📅 Date distribution:');
      const dateGroups = seasonFixtures.reduce((acc: any, fixture: any) => {
        const date = fixture.fixture?.date?.split('T')[0] || 'UNKNOWN';
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      }, {});

      Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]: [string, any]) => {
          console.log(`  ${date}: ${count} matches`);
        });

    } else {
      console.log(`❌ No fixtures found for League 15 in ${currentYear} season`);
    }
  } catch (error) {
    console.error('❌ Error checking FIFA Club World Cup season:', error);
  }

  // Check live fixtures specifically
  console.log('\n\n🔴 === CHECKING LIVE FIXTURES ===');
  try {
    const liveFixtures = await rapidApiService.getLiveFixtures();
    const liveLeague15 = liveFixtures.filter((f: any) => f.league?.id === 15);
    const liveLeague38 = liveFixtures.filter((f: any) => f.league?.id === 38);

    console.log(`Live fixtures for League 15: ${liveLeague15.length}`);
    liveLeague15.forEach((fixture: any, index: number) => {
      console.log(`  ${index + 1}. ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
      console.log(`     Status: ${fixture.fixture?.status?.short} | Elapsed: ${fixture.fixture?.status?.elapsed || 0}'`);
    });

    console.log(`\nLive fixtures for League 38: ${liveLeague38.length}`);
    liveLeague38.forEach((fixture: any, index: number) => {
      console.log(`  ${index + 1}. ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
      console.log(`     Status: ${fixture.fixture?.status?.short} | Elapsed: ${fixture.fixture?.status?.elapsed || 0}'`);
    });

  } catch (error) {
    console.error('❌ Error checking live fixtures:', error);
  }

  console.log('\n🏁 Analysis complete!');
}

// Run the check
checkLeagues38and15().catch(console.error);
