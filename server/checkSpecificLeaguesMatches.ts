
import { rapidApiService } from "./services/rapidApi";
import { format, addDays } from "date-fns";

async function checkSpecificLeaguesMatches() {
  console.log("=== Checking Today & Tomorrow Matches for Specific Leagues ===\n");
  
  // List of specific league IDs from the user's attachment
  const specificLeagueIds = [
    3071, 3110, 1157, 1160, 929, 924, 749, 1013, 1849, 1112,
    1849, 945, 1013, 924, 929, 749, 1112, 1157, 1160, 3071,
    3110, 1129, 740, 71, 95, 101, 79, 615, 751, 73, 27, 17,
    848, 546, 1084, 1086, 1084, 1086, 1068, 667, 740, 71, 95,
    101, 79, 615, 751, 73, 27, 17, 848, 546, 1084, 1086, 524,
    549, 1343, 541, 1160, 1347, 1384, 950, 531, 534, 1348,
    1006, 950, 534, 531, 1348, 1006, 11, 1365, 21, 1149,
    77, 1, 1346, 950, 534, 531, 1348, 1006, 136, 144, 143,
    136, 144, 143, 533, 534, 536, 1346, 533, 534, 536, 1346,
    533, 534, 536, 1346, 140, 78, 135, 61, 39, 1129, 563,
    533, 534, 536, 1346, 533, 534, 536, 1346, 533, 534, 536,
    1346, 533, 534, 536, 1346, 533, 534, 536, 1346, 533, 534,
    536, 1346, 533, 534, 536, 1346, 533, 534, 536, 1346, 533,
    534, 536, 1346, 533, 534, 536, 1346
  ];

  // Remove duplicates
  const uniqueLeagueIds = [...new Set(specificLeagueIds)];
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayDate = format(today, "yyyy-MM-dd");
  const tomorrowDate = format(tomorrow, "yyyy-MM-dd");
  
  console.log(`📅 Today's date: ${todayDate}`);
  console.log(`📅 Tomorrow's date: ${tomorrowDate}`);
  console.log(`🎯 Checking ${uniqueLeagueIds.length} unique leagues\n`);

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

    // Display today's matches
    console.log("🎯 TODAY'S MATCHES:");
    console.log("=" + "=".repeat(70));
    
    if (todayMatchingFixtures.length === 0) {
      console.log("❌ No matches found for today in the specified leagues");
    } else {
      // Group by league
      const todayByLeague = new Map();
      todayMatchingFixtures.forEach(fixture => {
        const leagueId = fixture.league.id;
        if (!todayByLeague.has(leagueId)) {
          todayByLeague.set(leagueId, {
            league: fixture.league,
            fixtures: []
          });
        }
        todayByLeague.get(leagueId).fixtures.push(fixture);
      });

      Array.from(todayByLeague.values()).forEach((leagueData, index) => {
        console.log(`\n${index + 1}. ${leagueData.league.name} (ID: ${leagueData.league.id})`);
        console.log(`   Country: ${leagueData.league.country}`);
        console.log(`   Matches: ${leagueData.fixtures.length}`);
        
        leagueData.fixtures.forEach((fixture, matchIndex) => {
          const date = new Date(fixture.fixture.date);
          const time = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const status = fixture.fixture.status.long;
          
          console.log(`   ${matchIndex + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
          console.log(`      Time: ${time} | Status: ${status}`);
          if (fixture.goals.home !== null && fixture.goals.away !== null) {
            console.log(`      Score: ${fixture.goals.home} - ${fixture.goals.away}`);
          }
          if (fixture.fixture.venue?.name) {
            console.log(`      Venue: ${fixture.fixture.venue.name}`);
          }
        });
      });
    }

    // Display tomorrow's matches
    console.log("\n\n🎯 TOMORROW'S MATCHES:");
    console.log("=" + "=".repeat(70));
    
    if (tomorrowMatchingFixtures.length === 0) {
      console.log("❌ No matches found for tomorrow in the specified leagues");
    } else {
      // Group by league
      const tomorrowByLeague = new Map();
      tomorrowMatchingFixtures.forEach(fixture => {
        const leagueId = fixture.league.id;
        if (!tomorrowByLeague.has(leagueId)) {
          tomorrowByLeague.set(leagueId, {
            league: fixture.league,
            fixtures: []
          });
        }
        tomorrowByLeague.get(leagueId).fixtures.push(fixture);
      });

      Array.from(tomorrowByLeague.values()).forEach((leagueData, index) => {
        console.log(`\n${index + 1}. ${leagueData.league.name} (ID: ${leagueData.league.id})`);
        console.log(`   Country: ${leagueData.league.country}`);
        console.log(`   Matches: ${leagueData.fixtures.length}`);
        
        leagueData.fixtures.forEach((fixture, matchIndex) => {
          const date = new Date(fixture.fixture.date);
          const time = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const status = fixture.fixture.status.long;
          
          console.log(`   ${matchIndex + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
          console.log(`      Time: ${time} | Status: ${status}`);
          if (fixture.goals.home !== null && fixture.goals.away !== null) {
            console.log(`      Score: ${fixture.goals.home} - ${fixture.goals.away}`);
          }
          if (fixture.fixture.venue?.name) {
            console.log(`      Venue: ${fixture.fixture.venue.name}`);
          }
        });
      });
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log("=" + "=".repeat(70));
    console.log(`Total unique leagues checked: ${uniqueLeagueIds.length}`);
    console.log(`Leagues with matches today: ${todayMatchingFixtures.length > 0 ? new Set(todayMatchingFixtures.map(f => f.league.id)).size : 0}`);
    console.log(`Leagues with matches tomorrow: ${tomorrowMatchingFixtures.length > 0 ? new Set(tomorrowMatchingFixtures.map(f => f.league.id)).size : 0}`);
    console.log(`Total matches today: ${todayMatchingFixtures.length}`);
    console.log(`Total matches tomorrow: ${tomorrowMatchingFixtures.length}`);

    // Show which specific leagues had matches
    if (todayMatchingFixtures.length > 0 || tomorrowMatchingFixtures.length > 0) {
      console.log("\n🎯 LEAGUES WITH MATCHES:");
      console.log("-".repeat(50));
      
      const allMatchingLeagueIds = new Set([
        ...todayMatchingFixtures.map(f => f.league.id),
        ...tomorrowMatchingFixtures.map(f => f.league.id)
      ]);

      allMatchingLeagueIds.forEach(leagueId => {
        const todayCount = todayMatchingFixtures.filter(f => f.league.id === leagueId).length;
        const tomorrowCount = tomorrowMatchingFixtures.filter(f => f.league.id === leagueId).length;
        const sampleFixture = todayMatchingFixtures.find(f => f.league.id === leagueId) ||
                            tomorrowMatchingFixtures.find(f => f.league.id === leagueId);
        
        if (sampleFixture) {
          console.log(`${sampleFixture.league.name} (ID: ${leagueId})`);
          console.log(`  Today: ${todayCount} matches, Tomorrow: ${tomorrowCount} matches`);
          console.log(`  Country: ${sampleFixture.league.country}`);
        }
      });
    }

  } catch (error) {
    console.error("❌ Error checking specific leagues matches:", error);
  }

  console.log("\n✅ Check Complete!");
}

// Run the check
checkSpecificLeaguesMatches().then(() => {
  console.log("\n🏁 Script completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
