
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays } from 'date-fns';

async function searchSpecificTeams() {
  console.log('🔍 Searching for Al Ahly and Inter Miami with different name variations...\n');
  
  const today = new Date();
  const dates = [];
  
  // Search wider date range (30 days before and after)
  for (let i = -30; i <= 30; i++) {
    const date = addDays(today, i);
    dates.push(date.toISOString().split('T')[0]);
  }

  console.log(`📅 Searching ${dates.length} dates from ${dates[0]} to ${dates[dates.length - 1]}\n`);

  const teamVariations = [
    // Al Ahly variations
    'al ahly', 'al-ahly', 'al ahli', 'al-ahli', 'ahly', 'ahli',
    // Inter Miami variations
    'inter miami', 'inter miami cf', 'miami', 'inter miami fc'
  ];

  let foundMatches = [];
  let totalFixturesSearched = 0;

  for (const date of dates) {
    try {
      console.log(`🌍 Searching ${date}...`);
      
      const allFixtures = await rapidApiService.getFixturesByDate(date, true);
      totalFixturesSearched += allFixtures.length;
      
      // Search for any team that contains our variations
      const potentialMatches = allFixtures.filter(fixture => {
        const homeTeam = fixture.teams.home.name.toLowerCase();
        const awayTeam = fixture.teams.away.name.toLowerCase();
        
        const hasTargetTeam = teamVariations.some(variation => 
          homeTeam.includes(variation) || awayTeam.includes(variation)
        );
        
        return hasTargetTeam;
      });

      if (potentialMatches.length > 0) {
        console.log(`\n✅ Found ${potentialMatches.length} potential matches for ${date}:`);
        
        potentialMatches.forEach((match, index) => {
          console.log(`\n${index + 1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`   🏆 League: ${match.league.name} (ID: ${match.league.id})`);
          console.log(`   🌍 Country: ${match.league.country}`);
          console.log(`   📅 Date: ${match.fixture.date}`);
          console.log(`   ⚽ Status: ${match.fixture.status.long}`);
          console.log(`   🆔 Fixture ID: ${match.fixture.id}`);
          
          foundMatches.push({
            date: date,
            homeTeam: match.teams.home.name,
            awayTeam: match.teams.away.name,
            league: match.league.name,
            country: match.league.country,
            fixtureDate: match.fixture.date,
            status: match.fixture.status.long,
            fixtureId: match.fixture.id
          });
        });
      }

      // Small delay to avoid rate limiting
      if (dates.indexOf(date) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error searching ${date}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SEARCH SUMMARY');
  console.log('=' + '='.repeat(80));
  console.log(`🔍 Total fixtures searched: ${totalFixturesSearched}`);
  console.log(`📅 Date range: ${dates.length} days`);
  console.log(`✅ Potential matches found: ${foundMatches.length}`);
  
  if (foundMatches.length === 0) {
    console.log('\n❌ No matches found for Al Ahly or Inter Miami');
    console.log('💡 This suggests either:');
    console.log('   - The teams are not in the API database');
    console.log('   - The match is not scheduled in the searched timeframe');
    console.log('   - The team names are significantly different in the API');
  } else {
    console.log('\n📋 All found matches:');
    foundMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`   League: ${match.league} (${match.country})`);
      console.log(`   Date: ${match.fixtureDate}`);
      console.log(`   Status: ${match.status}`);
    });
  }
}

// Run the search
searchSpecificTeams()
  .then(() => {
    console.log('\n✅ Search completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Search failed:', error);
    process.exit(1);
  });
