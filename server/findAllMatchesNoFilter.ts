
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays } from 'date-fns';

async function findAllMatchesWithoutAnyFilters() {
  console.log('🌍 Finding ALL matches without any filters for comprehensive comparison...\n');
  
  const today = new Date();
  const dates = [
    subDays(today, 2).toISOString().split('T')[0],
    subDays(today, 1).toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    addDays(today, 1).toISOString().split('T')[0],
    addDays(today, 2).toISOString().split('T')[0],
  ];

  console.log(`📅 Analyzing dates: ${dates.join(', ')}\n`);

  let totalMatches = 0;
  let allMatchesByDate: any = {};
  let allLeagues = new Set();
  let allCountries = new Set();
  let allTeams = new Set();

  for (const date of dates) {
    try {
      console.log(`🌍 Fetching ALL fixtures for ${date} (NO FILTERS)...`);
      
      // Get absolutely everything with comprehensive timezone coverage
      const allFixtures = await rapidApiService.getFixturesByDate(date, true);
      
      console.log(`📊 Total fixtures found for ${date}: ${allFixtures.length}`);
      totalMatches += allFixtures.length;
      allMatchesByDate[date] = allFixtures;

      // Collect all unique data for analysis
      allFixtures.forEach(fixture => {
        if (fixture.league) {
          allLeagues.add(`${fixture.league.name} (ID: ${fixture.league.id}, Country: ${fixture.league.country})`);
          if (fixture.league.country) {
            allCountries.add(fixture.league.country);
          }
        }
        if (fixture.teams) {
          if (fixture.teams.home?.name) {
            allTeams.add(`${fixture.teams.home.name} (ID: ${fixture.teams.home.id})`);
          }
          if (fixture.teams.away?.name) {
            allTeams.add(`${fixture.teams.away.name} (ID: ${fixture.teams.away.id})`);
          }
        }
      });

      // Show breakdown by league for this date
      const leagueBreakdown: any = {};
      allFixtures.forEach(fixture => {
        const leagueName = fixture.league?.name || 'Unknown League';
        const leagueId = fixture.league?.id || 'Unknown ID';
        const country = fixture.league?.country || 'Unknown Country';
        const key = `${leagueName} (${country})`;
        
        if (!leagueBreakdown[key]) {
          leagueBreakdown[key] = {
            leagueId,
            country,
            matchCount: 0,
            matches: []
          };
        }
        leagueBreakdown[key].matchCount++;
        leagueBreakdown[key].matches.push({
          id: fixture.fixture.id,
          home: fixture.teams.home?.name,
          away: fixture.teams.away?.name,
          status: fixture.fixture.status.short,
          date: fixture.fixture.date
        });
      });

      console.log(`\n📋 LEAGUE BREAKDOWN FOR ${date}:`);
      console.log('=' + '='.repeat(70));
      
      // Sort leagues by match count (descending)
      const sortedLeagues = Object.entries(leagueBreakdown)
        .sort(([,a]: any, [,b]: any) => b.matchCount - a.matchCount);

      sortedLeagues.forEach(([leagueName, data]: any, index) => {
        console.log(`\n${index + 1}. ${leagueName}`);
        console.log(`   🆔 League ID: ${data.leagueId}`);
        console.log(`   ⚽ Matches: ${data.matchCount}`);
        console.log(`   🌍 Country: ${data.country}`);
        
        // Show first 3 matches as examples
        if (data.matches.length > 0) {
          console.log(`   📝 Sample matches:`);
          data.matches.slice(0, 3).forEach((match: any, i: number) => {
            console.log(`      ${i + 1}. ${match.home} vs ${match.away} (${match.status})`);
          });
          if (data.matches.length > 3) {
            console.log(`      ... and ${data.matches.length - 3} more matches`);
          }
        }
      });

      // Show status breakdown
      const statusBreakdown: any = {};
      allFixtures.forEach(fixture => {
        const status = fixture.fixture.status.short;
        const statusLong = fixture.fixture.status.long;
        if (!statusBreakdown[status]) {
          statusBreakdown[status] = {
            count: 0,
            description: statusLong
          };
        }
        statusBreakdown[status].count++;
      });

      console.log(`\n📊 MATCH STATUS BREAKDOWN FOR ${date}:`);
      console.log('=' + '='.repeat(50));
      Object.entries(statusBreakdown)
        .sort(([,a]: any, [,b]: any) => b.count - a.count)
        .forEach(([status, data]: any) => {
          console.log(`   ${status}: ${data.count} matches (${data.description})`);
        });

    } catch (error) {
      console.error(`❌ Error fetching fixtures for ${date}:`, error);
    }
  }

  // Final comprehensive summary
  console.log('\n' + '='.repeat(100));
  console.log('🌍 COMPLETE UNFILTERED DATASET SUMMARY');
  console.log('=' + '='.repeat(100));
  
  console.log(`\n📊 OVERALL STATISTICS:`);
  console.log(`   🎯 Total Matches: ${totalMatches.toLocaleString()}`);
  console.log(`   🏆 Unique Leagues: ${allLeagues.size.toLocaleString()}`);
  console.log(`   🌍 Countries: ${allCountries.size.toLocaleString()}`);
  console.log(`   ⚽ Unique Teams: ${allTeams.size.toLocaleString()}`);

  console.log(`\n📅 MATCHES BY DATE:`);
  Object.entries(allMatchesByDate).forEach(([date, fixtures]: any) => {
    console.log(`   ${date}: ${fixtures.length.toLocaleString()} matches`);
  });

  console.log(`\n🌍 ALL COUNTRIES REPRESENTED:`);
  const sortedCountries = Array.from(allCountries).sort();
  sortedCountries.forEach((country, index) => {
    if (index % 5 === 0) console.log(''); // New line every 5 countries
    process.stdout.write(`   ${country}`.padEnd(20));
  });
  console.log('\n');

  console.log(`\n🏆 TOP 20 LEAGUES BY FREQUENCY:`);
  const leagueFrequency: any = {};
  Array.from(allLeagues).forEach(league => {
    const leagueName = league.toString().split(' (ID:')[0];
    leagueFrequency[leagueName] = (leagueFrequency[leagueName] || 0) + 1;
  });

  Object.entries(leagueFrequency)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 20)
    .forEach(([league, count]: any, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${league}: ${count} occurrences`);
    });

  // Search for specific interesting patterns
  console.log(`\n🔍 SPECIFIC PATTERN ANALYSIS:`);
  console.log('=' + '='.repeat(50));

  let alAhlyInterMiamiFound = false;
  let uefaU21Found = false;
  let fifaClubWorldCupFound = false;
  let internationalFriendliesFound = false;

  Object.values(allMatchesByDate).flat().forEach((fixture: any) => {
    const homeTeam = fixture.teams?.home?.name?.toLowerCase() || '';
    const awayTeam = fixture.teams?.away?.name?.toLowerCase() || '';
    const leagueName = fixture.league?.name?.toLowerCase() || '';

    // Al Ahly vs Inter Miami
    if ((homeTeam.includes('al ahly') && awayTeam.includes('inter miami')) ||
        (homeTeam.includes('inter miami') && awayTeam.includes('al ahly'))) {
      alAhlyInterMiamiFound = true;
      console.log(`   ✅ Al Ahly vs Inter Miami: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`      League: ${fixture.league.name} | Date: ${fixture.fixture.date}`);
    }

    // UEFA U21
    if (leagueName.includes('u21') && leagueName.includes('uefa')) {
      uefaU21Found = true;
      console.log(`   ✅ UEFA U21: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`      League: ${fixture.league.name} | Date: ${fixture.fixture.date}`);
    }

    // FIFA Club World Cup
    if (leagueName.includes('fifa') && leagueName.includes('world cup')) {
      fifaClubWorldCupFound = true;
      console.log(`   ✅ FIFA Club World Cup: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`      League: ${fixture.league.name} | Date: ${fixture.fixture.date}`);
    }

    // International Friendlies
    if (leagueName.includes('friendlies')) {
      internationalFriendliesFound = true;
    }
  });

  console.log(`\n📋 SEARCH RESULTS:`);
  console.log(`   Al Ahly vs Inter Miami: ${alAhlyInterMiamiFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   UEFA U21 Matches: ${uefaU21Found ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   FIFA Club World Cup: ${fifaClubWorldCupFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`   International Friendlies: ${internationalFriendliesFound ? '✅ FOUND' : '❌ NOT FOUND'}`);

  console.log(`\n💾 RAW DATA EXPORT:`);
  console.log('=' + '='.repeat(50));
  console.log('You can copy this data for external analysis:');
  console.log(`Total Fixtures: ${totalMatches}`);
  console.log(`Date Range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`Unique Leagues: ${allLeagues.size}`);
  console.log(`Unique Countries: ${allCountries.size}`);
  console.log(`Unique Teams: ${allTeams.size}`);
}

// Run the comprehensive analysis
findAllMatchesWithoutAnyFilters()
  .then(() => {
    console.log('\n✅ Complete unfiltered analysis finished!');
    console.log('💡 Compare this with your filtered results to see what might be getting excluded.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });
