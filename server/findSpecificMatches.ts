
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays } from 'date-fns';

async function findSpecificMatchesWithoutFilters() {
  console.log('🔍 Finding Al Ahly vs Inter Miami and UEFA U21 matches without any filters...\n');
  
  const today = new Date();
  const dates = [
    subDays(today, 2).toISOString().split('T')[0],
    subDays(today, 1).toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    addDays(today, 1).toISOString().split('T')[0],
    addDays(today, 2).toISOString().split('T')[0],
  ];

  console.log(`📅 Searching dates: ${dates.join(', ')}\n`);

  let foundAlAhlyInterMiami = false;
  let foundUefaU21Matches = [];

  for (const date of dates) {
    try {
      console.log(`🌍 Fetching ALL fixtures for ${date} without any filters...`);
      
      // Get all fixtures with comprehensive timezone coverage
      const allFixtures = await rapidApiService.getFixturesByDate(date, true);
      
      console.log(`📊 Total fixtures found for ${date}: ${allFixtures.length}`);

      // Search for Al Ahly vs Inter Miami
      const alAhlyInterMiamiMatches = allFixtures.filter(fixture => {
        const homeTeam = fixture.teams.home.name.toLowerCase();
        const awayTeam = fixture.teams.away.name.toLowerCase();
        
        return (
          (homeTeam.includes('al ahly') && awayTeam.includes('inter miami')) ||
          (homeTeam.includes('inter miami') && awayTeam.includes('al ahly'))
        );
      });

      if (alAhlyInterMiamiMatches.length > 0) {
        foundAlAhlyInterMiami = true;
        console.log('\n🎯 FOUND AL AHLY VS INTER MIAMI MATCH(ES):');
        console.log('=' + '='.repeat(60));
        
        alAhlyInterMiamiMatches.forEach((match, index) => {
          console.log(`\n${index + 1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`   🏆 League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`   🌍 Country: ${match.league.country}`);
          console.log(`   📅 Original API Date: ${match.fixture.date}`);
          console.log(`   🕐 Original Timezone: ${new Date(match.fixture.date).toISOString()}`);
          console.log(`   ⚽ Status: ${match.fixture.status.long} (${match.fixture.status.short})`);
          console.log(`   🏟️ Venue: ${match.fixture.venue?.name || 'TBD'}`);
          console.log(`   🆔 Fixture ID: ${match.fixture.id}`);
          console.log(`   🎮 Round: ${match.league.round || 'N/A'}`);
          
          if (match.goals.home !== null && match.goals.away !== null) {
            console.log(`   ⚽ Score: ${match.goals.home} - ${match.goals.away}`);
          }
          
          // Show full fixture data for debugging
          console.log(`   📋 Full Match Data:`);
          console.log(`      - Home Team ID: ${match.teams.home.id}`);
          console.log(`      - Away Team ID: ${match.teams.away.id}`);
          console.log(`      - League Logo: ${match.league.logo}`);
          console.log(`      - Season: ${match.league.season || 'N/A'}`);
        });
      }

      // Search for UEFA U21 Championship matches
      const u21Matches = allFixtures.filter(fixture => {
        const leagueName = fixture.league.name.toLowerCase();
        const homeTeam = fixture.teams.home.name.toLowerCase();
        const awayTeam = fixture.teams.away.name.toLowerCase();
        
        return (
          leagueName.includes('u21') ||
          leagueName.includes('under 21') ||
          homeTeam.includes('u21') ||
          awayTeam.includes('u21')
        ) && (
          leagueName.includes('uefa') ||
          leagueName.includes('euro') ||
          leagueName.includes('championship')
        );
      });

      if (u21Matches.length > 0) {
        foundUefaU21Matches = [...foundUefaU21Matches, ...u21Matches];
        
        console.log(`\n🏆 FOUND ${u21Matches.length} UEFA U21 MATCHES FOR ${date}:`);
        console.log('=' + '='.repeat(60));
        
        u21Matches.forEach((match, index) => {
          console.log(`\n${index + 1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`   🏆 League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`   🌍 Country: ${match.league.country}`);
          console.log(`   📅 Original API Date: ${match.fixture.date}`);
          console.log(`   🕐 Original Timezone: ${new Date(match.fixture.date).toISOString()}`);
          console.log(`   ⚽ Status: ${match.fixture.status.long} (${match.fixture.status.short})`);
          console.log(`   🏟️ Venue: ${match.fixture.venue?.name || 'TBD'}`);
          console.log(`   🆔 Fixture ID: ${match.fixture.id}`);
          console.log(`   🎮 Round: ${match.league.round || 'N/A'}`);
          
          if (match.goals.home !== null && match.goals.away !== null) {
            console.log(`   ⚽ Score: ${match.goals.home} - ${match.goals.away}`);
          }
        });
      }

      // Also search specifically for the teams mentioned in the images
      const specificTeamMatches = allFixtures.filter(fixture => {
        const homeTeam = fixture.teams.home.name.toLowerCase();
        const awayTeam = fixture.teams.away.name.toLowerCase();
        
        const targetTeams = [
          'spain u21', 'romania u21',
          'france u21', 'georgia u21', 
          'portugal u21', 'poland u21',
          'slovakia u21', 'italy u21'
        ];
        
        return targetTeams.some(team => 
          homeTeam.includes(team.replace(' u21', '')) && (homeTeam.includes('u21') || homeTeam.includes('under 21')) ||
          awayTeam.includes(team.replace(' u21', '')) && (awayTeam.includes('u21') || awayTeam.includes('under 21'))
        );
      });

      if (specificTeamMatches.length > 0) {
        console.log(`\n🎯 FOUND SPECIFIC U21 TEAM MATCHES FOR ${date}:`);
        console.log('=' + '='.repeat(60));
        
        specificTeamMatches.forEach((match, index) => {
          console.log(`\n${index + 1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`   🏆 League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`   🌍 Country: ${match.league.country}`);
          console.log(`   📅 Original API Date: ${match.fixture.date}`);
          console.log(`   🕐 UTC Time: ${new Date(match.fixture.date).toUTCString()}`);
          console.log(`   🕐 Local Time: ${new Date(match.fixture.date).toLocaleString()}`);
          console.log(`   ⚽ Status: ${match.fixture.status.long} (${match.fixture.status.short})`);
          console.log(`   🆔 Fixture ID: ${match.fixture.id}`);
        });
      }

    } catch (error) {
      console.error(`❌ Error fetching fixtures for ${date}:`, error);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SEARCH SUMMARY');
  console.log('=' + '='.repeat(80));
  
  if (foundAlAhlyInterMiami) {
    console.log('✅ Al Ahly vs Inter Miami match FOUND');
  } else {
    console.log('❌ Al Ahly vs Inter Miami match NOT FOUND');
    console.log('   💡 This might be because:');
    console.log('   - The match is scheduled for a different date');
    console.log('   - The team names are different in the API');
    console.log('   - The match is in a different league/competition');
  }
  
  if (foundUefaU21Matches.length > 0) {
    console.log(`✅ Found ${foundUefaU21Matches.length} UEFA U21 matches`);
  } else {
    console.log('❌ No UEFA U21 Championship matches found');
  }

  // Show original API timezone information
  console.log('\n🌍 TIMEZONE INFORMATION:');
  console.log('=' + '='.repeat(50));
  console.log('📋 All fixture dates are returned by the API in UTC format');
  console.log('📋 Format: YYYY-MM-DDTHH:MM:SS+00:00');
  console.log('📋 The API uses UTC as the base timezone');
  console.log('📋 Local times are calculated client-side based on user timezone');
}

// Run the search
findSpecificMatchesWithoutFilters()
  .then(() => {
    console.log('\n✅ Search completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Search failed:', error);
    process.exit(1);
  });
