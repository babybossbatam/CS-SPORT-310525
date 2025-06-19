
import { rapidApiService } from './services/rapidApi';
import { format } from 'date-fns';

async function checkSpecificFixtures() {
  console.log('🔍 Checking specific FIFA Club World Cup fixtures...\n');
  
  const fixtureIds = [
    1321691, // Monterrey vs Inter
    1321690, // Fluminense vs Borussia Dortmund  
    1321687, // River Plate vs Urawa Red Diamonds
    1321689  // Ulsan HD FC vs Mamelodi Sundowns FC
  ];

  const expectedMatches = [
    'Monterrey vs Inter',
    'Fluminense vs Borussia Dortmund',
    'River Plate vs Urawa Red Diamonds', 
    'Ulsan HD FC vs Mamelodi Sundowns FC'
  ];

  console.log(`📊 Checking ${fixtureIds.length} specific fixture IDs...\n`);

  for (let i = 0; i < fixtureIds.length; i++) {
    const fixtureId = fixtureIds[i];
    const expectedMatch = expectedMatches[i];
    
    try {
      console.log(`🔍 Checking Fixture ID: ${fixtureId} (${expectedMatch})`);
      console.log('=' + '='.repeat(60));
      
      // Get fixture details by ID
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch fixture ${fixtureId}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.response || data.response.length === 0) {
        console.error(`❌ No data found for fixture ${fixtureId}`);
        continue;
      }

      const fixture = data.response[0];
      
      // Extract all the details
      const fixtureDate = new Date(fixture.fixture.date);
      const localTime = fixtureDate.toLocaleString();
      const utcTime = fixtureDate.toISOString();
      
      console.log(`✅ FIXTURE FOUND:`);
      console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
      console.log(`   🏟️  Match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`   🏆 League: ${fixture.league.name} (ID: ${fixture.league.id})`);
      console.log(`   🌍 Country: ${fixture.league.country}`);
      console.log(`   📅 UTC Date/Time: ${utcTime}`);
      console.log(`   🕐 Local Date/Time: ${localTime}`);
      console.log(`   📍 Venue: ${fixture.fixture.venue?.name || 'TBD'}, ${fixture.fixture.venue?.city || 'TBD'}`);
      console.log(`   ⚽ Status: ${fixture.fixture.status.long} (${fixture.fixture.status.short})`);
      
      if (fixture.fixture.status.elapsed) {
        console.log(`   ⏱️  Elapsed: ${fixture.fixture.status.elapsed} minutes`);
      }
      
      console.log(`   🎯 Score: ${fixture.goals.home || 0} - ${fixture.goals.away || 0}`);
      
      if (fixture.fixture.round) {
        console.log(`   🏅 Round: ${fixture.fixture.round}`);
      }
      
      // Check if this is the expected match
      const actualMatch = `${fixture.teams.home.name} vs ${fixture.teams.away.name}`;
      if (actualMatch === expectedMatch) {
        console.log(`   ✅ MATCH CONFIRMED: This is the expected match!`);
      } else {
        console.log(`   ⚠️  MATCH MISMATCH: Expected "${expectedMatch}", got "${actualMatch}"`);
      }
      
      // Additional time zone analysis
      console.log(`\n   🌐 TIME ZONE ANALYSIS:`);
      console.log(`   📅 Date (YYYY-MM-DD): ${format(fixtureDate, 'yyyy-MM-dd')}`);
      console.log(`   🕐 Time (HH:mm): ${format(fixtureDate, 'HH:mm')}`);
      console.log(`   📊 Day of Week: ${format(fixtureDate, 'EEEE')}`);
      console.log(`   🌍 Time Zone: ${fixtureDate.getTimezoneOffset() / -60} hours from UTC`);
      
      // Check how many hours ago/from now
      const now = new Date();
      const diffHours = (now.getTime() - fixtureDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours > 0) {
        console.log(`   ⏰ Match was ${Math.abs(diffHours).toFixed(1)} hours ago`);
      } else {
        console.log(`   ⏰ Match is in ${Math.abs(diffHours).toFixed(1)} hours`);
      }
      
      console.log('\n');
      
    } catch (error) {
      console.error(`❌ Error checking fixture ${fixtureId}:`, error);
    }
  }

  // Now let's also check what date range these matches span
  console.log('\n📊 SUMMARY ANALYSIS:');
  console.log('=' + '='.repeat(60));
  
  // Let's also get all FIFA Club World Cup fixtures to see the full schedule
  try {
    console.log('🔍 Fetching all FIFA Club World Cup fixtures for context...');
    
    const allFifaFixtures = await rapidApiService.getFixturesByLeague(15, 2025);
    console.log(`📊 Total FIFA Club World Cup 2025 fixtures: ${allFifaFixtures.length}`);
    
    if (allFifaFixtures.length > 0) {
      // Get date range
      const dates = allFifaFixtures.map(f => new Date(f.fixture.date));
      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      console.log(`📅 Tournament Date Range: ${format(earliestDate, 'yyyy-MM-dd')} to ${format(latestDate, 'yyyy-MM-dd')}`);
      
      // Check which dates have matches
      const matchDates = [...new Set(allFifaFixtures.map(f => format(new Date(f.fixture.date), 'yyyy-MM-dd')))].sort();
      console.log(`📆 Match Days (${matchDates.length} days): ${matchDates.join(', ')}`);
      
      // Find our specific matches in the full list
      console.log('\n🎯 OUR SPECIFIC MATCHES IN FULL SCHEDULE:');
      fixtureIds.forEach(id => {
        const match = allFifaFixtures.find(f => f.fixture.id === id);
        if (match) {
          const matchDate = new Date(match.fixture.date);
          console.log(`   ${id}: ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`        📅 ${format(matchDate, 'yyyy-MM-dd HH:mm')} (${format(matchDate, 'EEEE')})`);
          console.log(`        🏟️  ${match.fixture.venue?.name || 'TBD'}`);
          console.log(`        ⚽ Status: ${match.fixture.status.short}`);
        } else {
          console.log(`   ${id}: ❌ NOT FOUND in FIFA Club World Cup fixtures`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching FIFA Club World Cup fixtures:', error);
  }

  console.log('\n✅ Specific fixture check completed!');
}

// Run the check
checkSpecificFixtures().then(() => {
  console.log('\n🏁 Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
