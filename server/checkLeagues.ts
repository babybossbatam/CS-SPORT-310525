import { rapidApiService } from "./services/rapidApi";

async function checkFifaAndEuroU21Leagues() {
  console.log("=== Checking FIFA Club World Cup and Euro U21 Leagues ===\n");

  try {
    // FIFA Club World Cup (League ID: 15)
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    console.log(`Tomorrow's date: ${tomorrowDate}\n`);
    console.log("1. FIFA Club World Cup:");
    const fifaClubWorldCup = await rapidApiService.getLeagueById(15);
    if (fifaClubWorldCup) {
      console.log(`✅ League Name: ${fifaClubWorldCup.league.name}`);
      console.log(`✅ Country: ${fifaClubWorldCup.country.name}`);
      console.log(`✅ Country Code: ${fifaClubWorldCup.country.code}`);
      console.log(`✅ League Type: ${fifaClubWorldCup.league.type}`);
      console.log(`✅ Logo: ${fifaClubWorldCup.league.logo}`);
      console.log(`✅ Flag: ${fifaClubWorldCup.country.flag}`);

      // Get current season info
      if (fifaClubWorldCup.seasons && fifaClubWorldCup.seasons.length > 0) {
        const currentSeason =
          fifaClubWorldCup.seasons.find((s) => s.current) ||
          fifaClubWorldCup.seasons[0];
        console.log(
          `✅ Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`,
        );
      }
    } else {
      console.log("❌ FIFA Club World Cup not found");
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Euro U21 Championship - Let's search for it
    console.log("2. Euro U21 Championship:");

    // Common Euro U21 league IDs to check
    const euroU21Ids = [8, 875, 876, 877]; // Different possible IDs for Euro U21
    let foundEuroU21 = false;

    for (const leagueId of euroU21Ids) {
      try {
        const euroU21 = await rapidApiService.getLeagueById(leagueId);
        if (euroU21 && euroU21.league.name.toLowerCase().includes("u21")) {
          console.log(`✅ League ID: ${leagueId}`);
          console.log(`✅ League Name: ${euroU21.league.name}`);
          console.log(`✅ Country: ${euroU21.country.name}`);
          console.log(`✅ Country Code: ${euroU21.country.code}`);
          console.log(`✅ League Type: ${euroU21.league.type}`);
          console.log(`✅ Logo: ${euroU21.league.logo}`);
          console.log(`✅ Flag: ${euroU21.country.flag}`);

          if (euroU21.seasons && euroU21.seasons.length > 0) {
            const currentSeason =
              euroU21.seasons.find((s) => s.current) || euroU21.seasons[0];
            console.log(
              `✅ Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`,
            );
          }
          foundEuroU21 = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!foundEuroU21) {
      console.log("❌ Euro U21 Championship not found with common IDs");
      console.log("🔍 Searching all leagues for U21...");

      // Search through all leagues for U21
      const allLeagues = await rapidApiService.getLeagues();
      const u21Leagues = allLeagues.filter(
        (league) =>
          league.league.name.toLowerCase().includes("u21") ||
          league.league.name.toLowerCase().includes("under 21") ||
          league.league.name.toLowerCase().includes("u-21"),
      );

      if (u21Leagues.length > 0) {
        console.log(`Found ${u21Leagues.length} U21 league(s):`);
        u21Leagues.forEach((league, index) => {
          console.log(`\n${index + 1}. League ID: ${league.league.id}`);
          console.log(`   Name: ${league.league.name}`);
          console.log(`   Country: ${league.country.name}`);
          console.log(`   Type: ${league.league.type}`);
        });
      } else {
        console.log("❌ No U21 leagues found in the API");
      }
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Additional FIFA tournaments search
    console.log("3. Other FIFA Tournaments:");
    const allLeagues = await rapidApiService.getLeagues();
    const fifaLeagues = allLeagues.filter(
      (league) =>
        league.league.name.toLowerCase().includes("fifa") ||
        league.league.name.toLowerCase().includes("world cup"),
    );

    if (fifaLeagues.length > 0) {
      console.log(`Found ${fifaLeagues.length} FIFA-related league(s):`);
      fifaLeagues.forEach((league, index) => {
        console.log(`\n${index + 1}. League ID: ${league.league.id}`);
        console.log(`   Name: ${league.league.name}`);
        console.log(`   Country: ${league.country.name}`);
        console.log(`   Type: ${league.league.type}`);
      });
    }
  } catch (error) {
    console.error("Error checking leagues:", error);
  }

  console.log("\n=== Check Complete ===");
}

// Run the check
checkFifaAndEuroU21Leagues().catch(console.error);
