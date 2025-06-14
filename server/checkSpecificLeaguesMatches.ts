
import { rapidApiService } from './services/rapidApi';
import { format, addDays } from 'date-fns';

// Your complete league list from the image
const specificLeagueIds = [
  // AFC Challenge Cup
  951,
  // AFC Champions League
  1132,
  // AFC Futsal Asian Cup
  870,
  // Asian Cup
  1, 4,
  // AFC Youth Championships
  794, 844,
  // Africa Cup of Nations (and qualifications)
  6, 7, 8, 9, 10, 16,
  // Africa Youth Championships
  796, 797, 798, 799,
  // Africa Club Championships
  35, 1819,
  // Africa Nations Championship
  1116,
  // Arab Club Champions Cup
  802,
  // Arab Championship
  820, 822, 847,
  // Arab Club Champions Cup
  801,
  // ASEAN Championship
  808,
  // Baltic Cup
  809,
  // CAF Champions League
  12,
  // CAF Super Cup
  39,
  // CAF Nations Cup (various levels)
  815, 816, 817, 818, 819,
  // CFU Caribbean Cup
  813,
  // CFU Club Championship
  840,
  // Champions League (various)
  2, 3, 848,
  // CONCACAF
  10, 846, 1064,
  // CONCACAF Gold Cup
  1065,
  // CONCACAF Champions League
  808,
  // CONCACAF Nations League
  1066,
  // CONCACAF U20 Championship
  1067,
  // CONCACAF League
  852,
  // CONCACAF U-17 Championship
  853,
  // CONCACAF W Championship
  854,
  // CONCACAF Olympics
  1066,
  // CONMEBOL Copa America
  9,
  // CONMEBOL Libertadores
  13,
  // CONMEBOL Sudamericana
  11,
  // CONMEBOL Recopa
  14,
  // CONMEBOL Women's Libertadores
  999,
  // CONMEBOL Youth Championships
  271,
  // Copa America
  9,
  // Copa Libertadores
  13,
  // Copa Sudamericana
  11,
  // Euro (European Championship)
  4,
  // European Championships
  271,
  // European Championship (Women)
  541,
  // EURO U21
  818,
  // UEFA Nations League
  5,
  // UEFA Champions League
  2,
  // UEFA Europa League
  3,
  // UEFA Conference League
  848,
  // UEFA Euro U19
  1346,
  // UEFA Euro U17
  1348,
  // UEFA Youth League
  826,
  // UEFA Women's Champions League
  1070,
  // Friendlies
  10,
  // FIFA Club World Cup
  15,
  // FIFA World Cup
  1,
  // FIFA World Cup (Women)
  106,
  // FIFA U-20 World Cup
  1371,
  // FIFA U-17 World Cup
  1372,
  // FIFA Confederations Cup
  17,
  // International Champions Cup
  641,
  // International Championships
  673,
  // King's Cup
  1046,
  // OFC Nations Cup
  702,
  // OFC Champions League
  28,
  // Olympics
  27,
  // Premier League Asia Trophy
  667,
  // SheBelieves Cup
  524,
  // Women's World Cup
  106,
  // World Cup
  1,
  // Youth Olympics
  525,
  // SAFF Championship
  903,
  // West Asian Championship
  807,
  // Gulf Cup
  801,
  // WAFF Championship
  531,
  // U17 World Championship
  893,
  // U20 World Championship
  892,
  // U17 Women's World Championship
  894,
  // U20 Women's World Championship
  897,
  // UEFA Youth League
  526,
  // UEFA Women's Euro
  541,
  // UEFA Nations League
  5,
  // Tournament Maurice Revello
  21,
  // Tournoi de France
  674,
  // SheBelieves Cup
  524,
  // Premier League Asia Trophy
  667,
  // Pinatar Cup
  899,
  // Cyprus Cup
  670,
  // Algarve Cup
  671,
  // Arnold Clark Cup
  892,
  // UEFA Futsal EURO
  15,
  // FIFA Beach Soccer World Cup
  75,
  // FIFA Futsal World Cup
  33,
  // AFF Championship
  25,
  // COSAFA Cup
  801,
  // CECAFA Cup
  903,
  // SAFF Championship
  903,
  // WAFF Championship
  531,
  // Arab Cup
  847,
  // Gulf Cup of Nations
  810,
  // West Asian Championship
  807,
  // Central Asian Championship
  809,
  // East Asian Championship
  808,
  // EAFF Championship
  808,
  // International Friendlies
  10,
  // World Cup Qualifiers
  40, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
];

async function checkTodayTomorrowMatches() {
  console.log('🚀 Starting Today & Tomorrow Match Checker for Your League List...');
  
  // Remove duplicates
  const uniqueLeagueIds = [...new Set(specificLeagueIds)];
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayDate = format(today, "yyyy-MM-dd");
  const tomorrowDate = format(tomorrow, "yyyy-MM-dd");
  
  console.log(`📅 Today's date: ${todayDate}`);
  console.log(`📅 Tomorrow's date: ${tomorrowDate}`);
  console.log(`🎯 Checking ${uniqueLeagueIds.length} unique leagues from your list\n`);

  try {
    // Get all fixtures for today and tomorrow
    console.log("🔍 Fetching all fixtures for today and tomorrow...");
    const [todayFixtures, tomorrowFixtures] = await Promise.all([
      rapidApiService.getFixturesByDate(todayDate, true),
      rapidApiService.getFixturesByDate(tomorrowDate, true)
    ]);

    console.log(`📊 Total fixtures today: ${todayFixtures.length}`);
    console.log(`📊 Total fixtures tomorrow: ${tomorrowFixtures.length}\n`);

    // Filter fixtures for our specific leagues
    const todayMatchingFixtures = todayFixtures.filter(fixture => 
      uniqueLeagueIds.includes(fixture.league.id)
    );

    const tomorrowMatchingFixtures = tomorrowFixtures.filter(fixture => 
      uniqueLeagueIds.includes(fixture.league.id)
    );

    console.log(`🏆 Matching fixtures today: ${todayMatchingFixtures.length}`);
    console.log(`🏆 Matching fixtures tomorrow: ${tomorrowMatchingFixtures.length}\n`);

    // Display TODAY'S MATCHES
    if (todayMatchingFixtures.length > 0) {
      console.log('═'.repeat(80));
      console.log(`🔥 TODAY'S MATCHES (${todayDate}) - ${todayMatchingFixtures.length} matches`);
      console.log('═'.repeat(80));

      // Group by league
      const todayByLeague = todayMatchingFixtures.reduce((acc, fixture) => {
        const leagueId = fixture.league.id;
        if (!acc[leagueId]) {
          acc[leagueId] = {
            league: fixture.league,
            matches: []
          };
        }
        acc[leagueId].matches.push(fixture);
        return acc;
      }, {} as any);

      Object.values(todayByLeague).forEach((group: any) => {
        console.log(`\n🏆 ${group.league.name} (ID: ${group.league.id})`);
        console.log(`🌍 Country: ${group.league.country}`);
        console.log(`📊 Matches: ${group.matches.length}`);
        console.log('─'.repeat(60));

        group.matches.forEach((fixture: any, index: number) => {
          const homeTeam = fixture.teams.home.name;
          const awayTeam = fixture.teams.away.name;
          const status = fixture.fixture.status.short;
          const elapsed = fixture.fixture.status.elapsed;
          const date = new Date(fixture.fixture.date);
          
          // Show score for live/finished matches
          let scoreDisplay = '';
          if (['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status)) {
            const homeScore = fixture.goals.home ?? 0;
            const awayScore = fixture.goals.away ?? 0;
            scoreDisplay = ` ${homeScore}-${awayScore}`;
          }

          console.log(`${index + 1}. ${homeTeam}${scoreDisplay ? scoreDisplay : ' vs'} ${awayTeam}`);
          console.log(`   ⏰ ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} | Status: ${status}${elapsed ? ` (${elapsed}')` : ''}`);
          console.log(`   🏟️ ${fixture.fixture.venue?.name || 'TBD'}`);
          console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
          console.log('');
        });
      });
    } else {
      console.log(`📭 No matches found for TODAY (${todayDate}) in your specified leagues`);
    }

    // Display TOMORROW'S MATCHES
    if (tomorrowMatchingFixtures.length > 0) {
      console.log('\n' + '═'.repeat(80));
      console.log(`🚀 TOMORROW'S MATCHES (${tomorrowDate}) - ${tomorrowMatchingFixtures.length} matches`);
      console.log('═'.repeat(80));

      // Group by league
      const tomorrowByLeague = tomorrowMatchingFixtures.reduce((acc, fixture) => {
        const leagueId = fixture.league.id;
        if (!acc[leagueId]) {
          acc[leagueId] = {
            league: fixture.league,
            matches: []
          };
        }
        acc[leagueId].matches.push(fixture);
        return acc;
      }, {} as any);

      Object.values(tomorrowByLeague).forEach((group: any) => {
        console.log(`\n🏆 ${group.league.name} (ID: ${group.league.id})`);
        console.log(`🌍 Country: ${group.league.country}`);
        console.log(`📊 Matches: ${group.matches.length}`);
        console.log('─'.repeat(60));

        group.matches.forEach((fixture: any, index: number) => {
          const homeTeam = fixture.teams.home.name;
          const awayTeam = fixture.teams.away.name;
          const status = fixture.fixture.status.short;
          const date = new Date(fixture.fixture.date);
          
          console.log(`${index + 1}. ${homeTeam} vs ${awayTeam}`);
          console.log(`   ⏰ ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} | Status: ${status}`);
          console.log(`   🏟️ ${fixture.fixture.venue?.name || 'TBD'}`);
          console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
          console.log('');
        });
      });
    } else {
      console.log(`📭 No matches found for TOMORROW (${tomorrowDate}) in your specified leagues`);
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`🎯 Leagues checked: ${uniqueLeagueIds.length}`);
    console.log(`📅 Today (${todayDate}): ${todayMatchingFixtures.length} matches`);
    console.log(`📅 Tomorrow (${tomorrowDate}): ${tomorrowMatchingFixtures.length} matches`);
    console.log(`🏆 Total matches: ${todayMatchingFixtures.length + tomorrowMatchingFixtures.length}`);

  } catch (error) {
    console.error('❌ Error checking matches:', error);
  }
}

// Run the script
async function main() {
  await checkTodayTomorrowMatches();
  console.log('\n✅ Today & Tomorrow match check completed!');
}

main().catch(console.error);
