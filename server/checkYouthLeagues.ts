
import { rapidApiService } from "./services/rapidApi";

async function checkYouthLeagues() {
  console.log("=== Checking U21, U23, and Youth Leagues ===\n");

  try {
    // Get all leagues and filter for youth competitions
    console.log("1. Searching for U21 leagues...");
    const allLeagues = await rapidApiService.getLeagues();
    
    const u21Leagues = allLeagues.filter(
      (league) =>
        league.league.name.toLowerCase().includes("u21") ||
        league.league.name.toLowerCase().includes("under 21") ||
        league.league.name.toLowerCase().includes("u-21") ||
        league.league.name.toLowerCase().includes("under-21")
    );

    console.log(`Found ${u21Leagues.length} U21 league(s):`);
    u21Leagues.forEach((league, index) => {
      console.log(`\n${index + 1}. League ID: ${league.league.id}`);
      console.log(`   Name: ${league.league.name}`);
      console.log(`   Country: ${league.country.name}`);
      console.log(`   Type: ${league.league.type}`);
      console.log(`   Logo: ${league.league.logo}`);
      if (league.seasons && league.seasons.length > 0) {
        const currentSeason = league.seasons.find((s) => s.current) || league.seasons[0];
        console.log(`   Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`);
      }
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Search for U23 leagues
    console.log("2. Searching for U23 leagues...");
    const u23Leagues = allLeagues.filter(
      (league) =>
        league.league.name.toLowerCase().includes("u23") ||
        league.league.name.toLowerCase().includes("under 23") ||
        league.league.name.toLowerCase().includes("u-23") ||
        league.league.name.toLowerCase().includes("under-23")
    );

    console.log(`Found ${u23Leagues.length} U23 league(s):`);
    u23Leagues.forEach((league, index) => {
      console.log(`\n${index + 1}. League ID: ${league.league.id}`);
      console.log(`   Name: ${league.league.name}`);
      console.log(`   Country: ${league.country.name}`);
      console.log(`   Type: ${league.league.type}`);
      console.log(`   Logo: ${league.league.logo}`);
      if (league.seasons && league.seasons.length > 0) {
        const currentSeason = league.seasons.find((s) => s.current) || league.seasons[0];
        console.log(`   Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`);
      }
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Search for other youth leagues (U20, U19, U18, etc.)
    console.log("3. Searching for other youth leagues (U20, U19, U18)...");
    const otherYouthLeagues = allLeagues.filter(
      (league) => {
        const name = league.league.name.toLowerCase();
        return (
          name.includes("u20") || name.includes("under 20") || name.includes("u-20") ||
          name.includes("u19") || name.includes("under 19") || name.includes("u-19") ||
          name.includes("u18") || name.includes("under 18") || name.includes("u-18") ||
          name.includes("youth") || name.includes("junior")
        ) && !name.includes("u21") && !name.includes("u23"); // Exclude already found U21/U23
      }
    );

    console.log(`Found ${otherYouthLeagues.length} other youth league(s):`);
    otherYouthLeagues.forEach((league, index) => {
      console.log(`\n${index + 1}. League ID: ${league.league.id}`);
      console.log(`   Name: ${league.league.name}`);
      console.log(`   Country: ${league.country.name}`);
      console.log(`   Type: ${league.league.type}`);
      if (league.seasons && league.seasons.length > 0) {
        const currentSeason = league.seasons.find((s) => s.current) || league.seasons[0];
        console.log(`   Current Season: ${currentSeason.year}`);
      }
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Check specific youth competitions we know about
    console.log("4. Checking specific youth competitions...");
    
    // Euro U21 Championship - Common IDs to check
    const euroU21Ids = [8, 875, 876, 877, 878];
    let foundEuroU21 = false;

    for (const leagueId of euroU21Ids) {
      try {
        const euroU21 = await rapidApiService.getLeagueById(leagueId);
        if (euroU21 && euroU21.league.name.toLowerCase().includes("u21")) {
          console.log(`✅ Euro U21 Championship found:`);
          console.log(`   League ID: ${leagueId}`);
          console.log(`   Name: ${euroU21.league.name}`);
          console.log(`   Country: ${euroU21.country.name}`);
          console.log(`   Type: ${euroU21.league.type}`);
          foundEuroU21 = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!foundEuroU21) {
      console.log("❌ Euro U21 Championship not found with common IDs");
    }

    // Olympic Football Tournament (often U23)
    try {
      const olympics = await rapidApiService.getLeagueById(480); // Common Olympic ID
      if (olympics) {
        console.log(`\n✅ Olympic Football Tournament found:`);
        console.log(`   League ID: 480`);
        console.log(`   Name: ${olympics.league.name}`);
        console.log(`   Country: ${olympics.country.name}`);
        console.log(`   Type: ${olympics.league.type}`);
      }
    } catch (error) {
      console.log("❌ Olympic Football Tournament not found");
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Summary
    console.log("5. Summary:");
    console.log(`Total U21 leagues found: ${u21Leagues.length}`);
    console.log(`Total U23 leagues found: ${u23Leagues.length}`);
    console.log(`Total other youth leagues found: ${otherYouthLeagues.length}`);
    
    // Show World country youth leagues specifically
    const worldYouthLeagues = [...u21Leagues, ...u23Leagues, ...otherYouthLeagues].filter(
      league => league.country.name.toLowerCase() === "world"
    );
    
    console.log(`\nWorld country youth leagues: ${worldYouthLeagues.length}`);
    worldYouthLeagues.forEach((league, index) => {
      console.log(`${index + 1}. ${league.league.name} (ID: ${league.league.id})`);
    });

  } catch (error) {
    console.error("Error checking youth leagues:", error);
  }
}

// Run the check
checkYouthLeagues().then(() => {
  console.log("\n✅ Youth leagues check completed!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
