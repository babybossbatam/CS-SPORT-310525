
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

  // Declare worldFixtures in broader scope to use later
  let worldFixtures: any[] = [];

  try {
    // 1. Check RapidAPI for Euro U21 league (ID: 38)
    console.log('📡 Checking RapidAPI...');
    console.log('='.repeat(50));
    
    // Get fixtures by date
    const rapidFixtures = await rapidApiService.getFixturesByDate(testDate, true);
    console.log(`Found ${rapidFixtures.length} total fixtures on ${testDate}`);

    // Filter for only World competitions (country = "World") and exclude women's matches and China
    worldFixtures = rapidFixtures.filter(fixture => {
      const isWorldCompetition = fixture.country?.name === "World" || 
                                 fixture.country?.name?.toLowerCase() === "world";
      
      const leagueName = fixture.league?.name?.toLowerCase() || '';
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || '';
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || '';
      
      const isWomensMatch = leagueName.includes('women') || 
                           leagueName.includes('female') || 
                           leagueName.includes('ladies') ||
                           leagueName.includes('feminine') ||
                           leagueName.includes('feminin') ||
                           leagueName.includes('donne') ||
                           leagueName.includes('frauen') ||
                           leagueName.includes('femenino') ||
                           leagueName.includes("women's");
      
      const isChinaMatch = leagueName.includes('china') ||
                          leagueName.includes('chinese') ||
                          homeTeamName.includes('china') ||
                          awayTeamName.includes('china') ||
                          homeTeamName.includes('chinese') ||
                          awayTeamName.includes('chinese');
      
      return isWorldCompetition && !isWomensMatch && !isChinaMatch;
    });

    console.log(`\n🌍 World competitions found: ${worldFixtures.length}`);
    
    // Group by league for better organization
    const worldLeagues = {};
    worldFixtures.forEach(fixture => {
      const leagueId = fixture.league.id;
      const leagueName = fixture.league.name;
      
      if (!worldLeagues[leagueId]) {
        worldLeagues[leagueId] = {
          name: leagueName,
          fixtures: []
        };
      }
      worldLeagues[leagueId].fixtures.push(fixture);
    });

    // Display all World leagues and their matches
    Object.entries(worldLeagues).forEach(([leagueId, leagueData]) => {
      console.log(`\n🏆 ${leagueData.name} (ID: ${leagueId}) - ${leagueData.fixtures.length} matches:`);
      leagueData.fixtures.forEach(fixture => {
        console.log(`  - ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`    Date: ${fixture.fixture.date}, Status: ${fixture.fixture.status.short}`);
      });
    });

    // Search for specific team combinations in World competitions only
    console.log('\n🔍 Searching for specific matches in World competitions...');
    
    // Search for Euro U21 teams in World competitions
    for (const match of targetMatches) {
      const found = worldFixtures.find(fixture => 
        (fixture.teams.home.name.toLowerCase().includes(match.home.toLowerCase().replace(' u21', '')) &&
         fixture.teams.away.name.toLowerCase().includes(match.away.toLowerCase().replace(' u21', ''))) ||
        (fixture.teams.home.name.toLowerCase().includes(match.home.toLowerCase()) &&
         fixture.teams.away.name.toLowerCase().includes(match.away.toLowerCase()))
      );
      
      if (found) {
        console.log(`✅ Found in World competitions: ${found.teams.home.name} vs ${found.teams.away.name}`);
        console.log(`   League: ${found.league.name}, Country: ${found.country?.name}, Date: ${found.fixture.date}`);
      } else {
        console.log(`❌ Not found in World competitions: ${match.home} vs ${match.away}`);
      }
    }

    // Search for FIFA match in World competitions
    const foundFifa = worldFixtures.find(fixture => 
      (fixture.teams.home.name.toLowerCase().includes('al ahly') &&
       fixture.teams.away.name.toLowerCase().includes('inter miami')) ||
      (fixture.teams.away.name.toLowerCase().includes('al ahly') &&
       fixture.teams.home.name.toLowerCase().includes('inter miami'))
    );

    if (foundFifa) {
      console.log(`✅ Found FIFA match in World competitions: ${foundFifa.teams.home.name} vs ${foundFifa.teams.away.name}`);
      console.log(`   League: ${foundFifa.league.name}, Country: ${foundFifa.country?.name}, Date: ${foundFifa.fixture.date}`);
    } else {
      console.log(`❌ FIFA match not found in World competitions: ${fifaMatch.home} vs ${fifaMatch.away}`);
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

  // 3. Check what World competitions are available
  console.log('\n\n📊 Summary of All Available World Competitions:');
  console.log('='.repeat(50));
  
  try {
    const allLeagues = await rapidApiService.getLeagues();
    const worldLeagues = allLeagues.filter(league => 
      league.country?.name === "World" || 
      league.country?.name?.toLowerCase() === "world"
    );

    console.log(`Found ${worldLeagues.length} World competitions in RapidAPI:`);
    worldLeagues.forEach(league => {
      console.log(`- ${league.league.name} (ID: ${league.league.id})`);
    });

    // Also show which of these have fixtures on our test date
    const worldLeagueIds = worldLeagues.map(l => l.league.id);
    const activeWorldLeagues = worldFixtures.reduce((acc, fixture) => {
      const leagueId = fixture.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          name: fixture.league.name,
          count: 0
        };
      }
      acc[leagueId].count++;
      return acc;
    }, {});

    console.log(`\n📅 World leagues with fixtures on ${testDate}:`);
    Object.entries(activeWorldLeagues).forEach(([leagueId, data]) => {
      console.log(`- ${data.name} (ID: ${leagueId}): ${data.count} matches`);
    });

  } catch (error) {
    console.error('❌ Error getting leagues:', error);
  }
}

// Run the check
checkEuroU21Matches().catch(console.error);
