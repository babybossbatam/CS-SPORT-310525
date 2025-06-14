
import { rapidApiService } from './services/rapidApi';
import sportsradarApi from './services/sportsradarApi';

// Euro U21 matches from the image
const targetMatches = [
  { home: 'Spain U21', away: 'Romania U21', time: '00:00' },
  { home: 'France U21', away: 'Georgia U21', time: '03:00' },
  { home: 'Portugal U21', away: 'Poland U21', time: '03:00' },
  { home: 'Slovakia U21', away: 'Italy U21', time: '03:00' }
];

// FIFA Club World Cup match
const fifaMatch = { home: 'Al Ahly SC', away: 'Inter Miami', time: '08:00' };

async function checkEuroU21Matches() {
  console.log('🔍 Checking Euro U21 matches in both APIs...\n');

  // Test date - using a future date where these matches might be scheduled
  const testDate = '2025-06-16'; // Adjust this date as needed

  try {
    // 1. Check RapidAPI for Euro U21 league (ID: 38)
    console.log('📡 Checking RapidAPI...');
    console.log('='.repeat(50));
    
    // Get fixtures by date
    const rapidFixtures = await rapidApiService.getFixturesByDate(testDate, true);
    console.log(`Found ${rapidFixtures.length} total fixtures on ${testDate}`);

    // Filter for Euro U21 (League ID 38)
    const euroU21Fixtures = rapidFixtures.filter(fixture => 
      fixture.league?.id === 38 || 
      fixture.league?.name?.toLowerCase().includes('uefa u21') ||
      fixture.league?.name?.toLowerCase().includes('euro u21')
    );

    console.log(`\n🇪🇺 Euro U21 Championship fixtures found: ${euroU21Fixtures.length}`);
    euroU21Fixtures.forEach(fixture => {
      console.log(`- ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`  Date: ${fixture.fixture.date}, Status: ${fixture.fixture.status.short}`);
      console.log(`  League: ${fixture.league.name} (ID: ${fixture.league.id})`);
    });

    // Check for FIFA Club World Cup (League ID 15)
    const fifaFixtures = rapidFixtures.filter(fixture => 
      fixture.league?.id === 15 || 
      fixture.league?.name?.toLowerCase().includes('fifa club world cup')
    );

    console.log(`\n🏆 FIFA Club World Cup fixtures found: ${fifaFixtures.length}`);
    fifaFixtures.forEach(fixture => {
      console.log(`- ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`  Date: ${fixture.fixture.date}, Status: ${fixture.fixture.status.short}`);
      console.log(`  League: ${fixture.league.name} (ID: ${fixture.league.id})`);
    });

    // Search for specific team combinations
    console.log('\n🔍 Searching for specific Euro U21 matches...');
    for (const match of targetMatches) {
      const found = rapidFixtures.find(fixture => 
        (fixture.teams.home.name.toLowerCase().includes(match.home.toLowerCase().replace(' u21', '')) &&
         fixture.teams.away.name.toLowerCase().includes(match.away.toLowerCase().replace(' u21', ''))) ||
        (fixture.teams.home.name.toLowerCase().includes(match.home.toLowerCase()) &&
         fixture.teams.away.name.toLowerCase().includes(match.away.toLowerCase()))
      );
      
      if (found) {
        console.log(`✅ Found: ${found.teams.home.name} vs ${found.teams.away.name}`);
        console.log(`   League: ${found.league.name}, Date: ${found.fixture.date}`);
      } else {
        console.log(`❌ Not found: ${match.home} vs ${match.away}`);
      }
    }

    // Search for FIFA match
    const foundFifa = rapidFixtures.find(fixture => 
      (fixture.teams.home.name.toLowerCase().includes('al ahly') &&
       fixture.teams.away.name.toLowerCase().includes('inter miami')) ||
      (fixture.teams.away.name.toLowerCase().includes('al ahly') &&
       fixture.teams.home.name.toLowerCase().includes('inter miami'))
    );

    if (foundFifa) {
      console.log(`✅ Found FIFA match: ${foundFifa.teams.home.name} vs ${foundFifa.teams.away.name}`);
      console.log(`   League: ${foundFifa.league.name}, Date: ${foundFifa.fixture.date}`);
    } else {
      console.log(`❌ FIFA match not found: ${fifaMatch.home} vs ${fifaMatch.away}`);
    }

  } catch (error) {
    console.error('❌ RapidAPI Error:', error);
  }

  try {
    // 2. Check SportsRadar API
    console.log('\n\n📡 Checking SportsRadar API...');
    console.log('='.repeat(50));
    
    // Get football/soccer leagues
    const sportsRadarLeagues = await sportsradarApi.getFootballLeagues();
    console.log(`Found ${sportsRadarLeagues?.length || 0} soccer leagues in SportsRadar`);

    // Look for Euro/UEFA competitions
    const euroLeagues = sportsRadarLeagues?.filter(league => 
      league.name?.toLowerCase().includes('euro') ||
      league.name?.toLowerCase().includes('uefa') ||
      league.name?.toLowerCase().includes('u21')
    ) || [];

    console.log(`\n🇪🇺 Euro/UEFA leagues found: ${euroLeagues.length}`);
    euroLeagues.forEach(league => {
      console.log(`- ${league.name} (ID: ${league.id})`);
    });

    // Try to get fixtures by date
    const sportsRadarFixtures = await sportsradarApi.getFixturesByDate(testDate);
    console.log(`\nSportsRadar fixtures on ${testDate}: ${sportsRadarFixtures?.length || 0}`);

    // Search for Euro U21 matches in SportsRadar
    if (sportsRadarFixtures && sportsRadarFixtures.length > 0) {
      console.log('\n🔍 Searching SportsRadar fixtures for Euro U21 matches...');
      
      for (const match of targetMatches) {
        const found = sportsRadarFixtures.find(fixture => 
          (fixture.home_team?.name?.toLowerCase().includes(match.home.toLowerCase().replace(' u21', '')) &&
           fixture.away_team?.name?.toLowerCase().includes(match.away.toLowerCase().replace(' u21', ''))) ||
          (fixture.home_team?.name?.toLowerCase().includes(match.home.toLowerCase()) &&
           fixture.away_team?.name?.toLowerCase().includes(match.away.toLowerCase()))
        );
        
        if (found) {
          console.log(`✅ Found in SportsRadar: ${found.home_team?.name} vs ${found.away_team?.name}`);
          console.log(`   Tournament: ${found.tournament?.name}, Date: ${found.scheduled}`);
        } else {
          console.log(`❌ Not found in SportsRadar: ${match.home} vs ${match.away}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ SportsRadar API Error:', error);
  }

  // 3. Check what leagues are available for Euro competitions
  console.log('\n\n📊 Summary of Available Euro Competitions:');
  console.log('='.repeat(50));
  
  try {
    const allLeagues = await rapidApiService.getLeagues();
    const euroLeagues = allLeagues.filter(league => 
      league.league.name.toLowerCase().includes('euro') ||
      league.league.name.toLowerCase().includes('uefa') ||
      league.league.name.toLowerCase().includes('u21') ||
      league.league.name.toLowerCase().includes('u20') ||
      league.league.name.toLowerCase().includes('youth')
    );

    console.log(`Found ${euroLeagues.length} Euro/UEFA/Youth leagues in RapidAPI:`);
    euroLeagues.forEach(league => {
      console.log(`- ${league.league.name} (ID: ${league.league.id}, Country: ${league.country?.name || 'N/A'})`);
    });

  } catch (error) {
    console.error('❌ Error getting leagues:', error);
  }
}

// Run the check
checkEuroU21Matches().catch(console.error);
