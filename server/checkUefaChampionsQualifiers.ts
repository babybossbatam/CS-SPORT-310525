
import { rapidApiService } from "./services/rapidApi";

async function checkUefaChampionsLeagueQualifiers() {
  console.log("=== Checking UEFA Champions League Qualifiers Coverage ===\n");

  try {
    // UEFA Champions League (ID: 2) - includes qualifiers
    console.log("1. UEFA Champions League (includes qualifiers):");
    const championsLeague = await rapidApiService.getLeagueById(2);
    
    if (championsLeague) {
      console.log(`✅ League Name: ${championsLeague.league.name}`);
      console.log(`✅ Country: ${championsLeague.country.name}`);
      console.log(`✅ League Type: ${championsLeague.league.type}`);
      console.log(`✅ Logo: ${championsLeague.league.logo}`);
      
      if (championsLeague.seasons && championsLeague.seasons.length > 0) {
        const currentSeason = championsLeague.seasons.find(s => s.current) || championsLeague.seasons[0];
        console.log(`✅ Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`);
      }
    } else {
      console.log("❌ UEFA Champions League not found");
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Get current season fixtures
    console.log("2. UEFA Champions League Fixtures (including qualifiers):");
    try {
      const clFixtures = await rapidApiService.getFixturesByLeague(2, 2025);
      console.log(`Found ${clFixtures.length} UEFA Champions League fixtures for 2025:`);

      if (clFixtures.length > 0) {
        // Group by round to identify qualifiers
        const fixturesByRound = clFixtures.reduce((acc, fixture) => {
          const round = fixture.league.round || 'Unknown Round';
          if (!acc[round]) acc[round] = [];
          acc[round].push(fixture);
          return acc;
        }, {});

        console.log("\nRounds available:");
        Object.keys(fixturesByRound).forEach(round => {
          console.log(`📅 ${round}: ${fixturesByRound[round].length} matches`);
          
          // Show sample matches for qualifier rounds
          if (round.toLowerCase().includes('qualifying') || 
              round.toLowerCase().includes('qualifier') ||
              round.toLowerCase().includes('1st qualifying') ||
              round.toLowerCase().includes('2nd qualifying') ||
              round.toLowerCase().includes('3rd qualifying') ||
              round.toLowerCase().includes('playoff')) {
            
            console.log(`   🎯 QUALIFIER ROUND DETECTED!`);
            fixturesByRound[round].slice(0, 3).forEach((fixture, index) => {
              const date = new Date(fixture.fixture.date).toLocaleDateString();
              console.log(`   ${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${date})`);
            });
            if (fixturesByRound[round].length > 3) {
              console.log(`   ... and ${fixturesByRound[round].length - 3} more qualifier matches`);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error fetching UEFA Champions League fixtures:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Check for today's Champions League matches
    console.log("3. Today's UEFA Champions League matches:");
    const today = new Date().toISOString().split('T')[0];
    try {
      const todayFixtures = await rapidApiService.getFixturesByDate(today, true);
      const clTodayFixtures = todayFixtures.filter(fixture => fixture.league.id === 2);
      
      if (clTodayFixtures.length > 0) {
        console.log(`Found ${clTodayFixtures.length} UEFA Champions League matches today:`);
        clTodayFixtures.forEach((fixture, index) => {
          const time = new Date(fixture.fixture.date).toLocaleTimeString();
          console.log(`${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
          console.log(`   Time: ${time}`);
          console.log(`   Round: ${fixture.league.round}`);
          console.log(`   Status: ${fixture.fixture.status.long}`);
        });
      } else {
        console.log("No UEFA Champions League matches today");
      }
    } catch (error) {
      console.error("Error checking today's Champions League matches:", error);
    }

  } catch (error) {
    console.error("Error checking UEFA Champions League:", error);
  }

  console.log("\n=== UEFA Champions League Qualifiers Check Complete ===");
}

// Run the check
checkUefaChampionsLeagueQualifiers().catch(console.error);
