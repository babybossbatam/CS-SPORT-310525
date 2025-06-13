
import { rapidApiService } from "./services/rapidApi";
import { format } from "date-fns";

async function checkTodayWorldLeagues() {
  console.log("=== Checking Today's World Country Leagues ===\n");
  
  const today = new Date();
  const todayDate = format(today, "yyyy-MM-dd");
  console.log(`📅 Today's date: ${todayDate}\n`);

  try {
    // Get all fixtures for today
    console.log("🔍 Fetching all fixtures for today...");
    const allFixtures = await rapidApiService.getFixturesByDate(todayDate, true);
    console.log(`📊 Total fixtures available today: ${allFixtures.length}\n`);

    // Filter for World country leagues
    const worldFixtures = allFixtures.filter(fixture => 
      fixture.league.country === "World" || 
      fixture.league.country === "Europe" ||
      fixture.league.country === "International"
    );

    console.log(`🌍 World/Europe/International fixtures today: ${worldFixtures.length}\n`);

    if (worldFixtures.length === 0) {
      console.log("❌ No World country leagues found for today");
      return;
    }

    // Group by league type
    const uefaLeagues = new Map();
    const fifaLeagues = new Map();
    const youthLeagues = new Map();
    const otherLeagues = new Map();

    worldFixtures.forEach(fixture => {
      const leagueName = fixture.league.name.toLowerCase();
      const leagueId = fixture.league.id;
      const leagueData = {
        id: leagueId,
        name: fixture.league.name,
        country: fixture.league.country,
        logo: fixture.league.logo,
        fixtures: []
      };

      // Categorize leagues
      if (leagueName.includes("uefa") || leagueName.includes("euro")) {
        if (leagueName.includes("u21") || leagueName.includes("u19") || 
            leagueName.includes("u17") || leagueName.includes("youth")) {
          if (!youthLeagues.has(leagueId)) {
            youthLeagues.set(leagueId, leagueData);
          }
          youthLeagues.get(leagueId).fixtures.push(fixture);
        } else {
          if (!uefaLeagues.has(leagueId)) {
            uefaLeagues.set(leagueId, leagueData);
          }
          uefaLeagues.get(leagueId).fixtures.push(fixture);
        }
      } else if (leagueName.includes("fifa") || leagueName.includes("world cup")) {
        if (!fifaLeagues.has(leagueId)) {
          fifaLeagues.set(leagueId, leagueData);
        }
        fifaLeagues.get(leagueId).fixtures.push(fixture);
      } else {
        if (!otherLeagues.has(leagueId)) {
          otherLeagues.set(leagueId, leagueData);
        }
        otherLeagues.get(leagueId).fixtures.push(fixture);
      }
    });

    // Display UEFA Major Leagues
    console.log("🏆 UEFA MAJOR LEAGUES:");
    console.log("=" + "=".repeat(50));
    if (uefaLeagues.size > 0) {
      Array.from(uefaLeagues.values()).forEach((league, index) => {
        console.log(`\n${index + 1}. ${league.name} (ID: ${league.id})`);
        console.log(`   Country: ${league.country}`);
        console.log(`   Matches today: ${league.fixtures.length}`);
        
        league.fixtures.slice(0, 5).forEach((fixture, matchIndex) => {
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
        });
        
        if (league.fixtures.length > 5) {
          console.log(`   ... and ${league.fixtures.length - 5} more matches`);
        }
      });
    } else {
      console.log("❌ No UEFA major leagues found for today");
    }

    // Display UEFA Youth Leagues
    console.log("\n🏅 UEFA YOUTH LEAGUES:");
    console.log("=" + "=".repeat(50));
    if (youthLeagues.size > 0) {
      Array.from(youthLeagues.values()).forEach((league, index) => {
        console.log(`\n${index + 1}. ${league.name} (ID: ${league.id})`);
        console.log(`   Country: ${league.country}`);
        console.log(`   Matches today: ${league.fixtures.length}`);
        
        league.fixtures.forEach((fixture, matchIndex) => {
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
        });
      });
    } else {
      console.log("❌ No UEFA youth leagues found for today");
    }

    // Display FIFA Leagues
    console.log("\n🌍 FIFA LEAGUES:");
    console.log("=" + "=".repeat(50));
    if (fifaLeagues.size > 0) {
      Array.from(fifaLeagues.values()).forEach((league, index) => {
        console.log(`\n${index + 1}. ${league.name} (ID: ${league.id})`);
        console.log(`   Country: ${league.country}`);
        console.log(`   Matches today: ${league.fixtures.length}`);
        
        league.fixtures.forEach((fixture, matchIndex) => {
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
        });
      });
    } else {
      console.log("❌ No FIFA leagues found for today");
    }

    // Display Other International Leagues
    console.log("\n🌐 OTHER INTERNATIONAL LEAGUES:");
    console.log("=" + "=".repeat(50));
    if (otherLeagues.size > 0) {
      Array.from(otherLeagues.values()).forEach((league, index) => {
        console.log(`\n${index + 1}. ${league.name} (ID: ${league.id})`);
        console.log(`   Country: ${league.country}`);
        console.log(`   Matches today: ${league.fixtures.length}`);
        
        league.fixtures.slice(0, 3).forEach((fixture, matchIndex) => {
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
        });
        
        if (league.fixtures.length > 3) {
          console.log(`   ... and ${league.fixtures.length - 3} more matches`);
        }
      });
    } else {
      console.log("❌ No other international leagues found for today");
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log("=" + "=".repeat(50));
    console.log(`Total World country leagues today: ${uefaLeagues.size + youthLeagues.size + fifaLeagues.size + otherLeagues.size}`);
    console.log(`UEFA Major Leagues: ${uefaLeagues.size}`);
    console.log(`UEFA Youth Leagues: ${youthLeagues.size}`);
    console.log(`FIFA Leagues: ${fifaLeagues.size}`);
    console.log(`Other International Leagues: ${otherLeagues.size}`);
    console.log(`Total matches: ${worldFixtures.length}`);

    // Check specific important leagues
    console.log("\n🔍 CHECKING SPECIFIC IMPORTANT LEAGUES:");
    console.log("=" + "=".repeat(50));
    
    const importantLeagueIds = [
      { id: 2, name: "UEFA Champions League" },
      { id: 3, name: "UEFA Europa League" },
      { id: 848, name: "UEFA Europa Conference League" },
      { id: 5, name: "UEFA Nations League" },
      { id: 15, name: "FIFA Club World Cup" },
      { id: 38, name: "UEFA U21 Championship" },
      { id: 875, name: "UEFA U19 Championship" },
      { id: 876, name: "UEFA U17 Championship" }
    ];

    let foundImportantLeagues = 0;
    for (const importantLeague of importantLeagueIds) {
      const foundFixtures = worldFixtures.filter(f => f.league.id === importantLeague.id);
      if (foundFixtures.length > 0) {
        foundImportantLeagues++;
        console.log(`✅ ${importantLeague.name}: ${foundFixtures.length} matches`);
        foundFixtures.forEach((fixture, index) => {
          const date = new Date(fixture.fixture.date);
          const time = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          console.log(`   ${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name} at ${time}`);
        });
      } else {
        console.log(`❌ ${importantLeague.name}: No matches today`);
      }
    }

    console.log(`\n🎯 Found ${foundImportantLeagues} important leagues with matches today`);

  } catch (error) {
    console.error("❌ Error checking today's World leagues:", error);
  }

  console.log("\n✅ World Leagues Check Complete!");
}

// Run the check
checkTodayWorldLeagues().then(() => {
  console.log("\n🏁 Script completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
