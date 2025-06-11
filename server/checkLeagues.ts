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
    console.log("\n" + "=".repeat(50) + "\n");

    // 4. Get fixtures for FIFA Club World Cup (ID: 15)
    console.log("4. FIFA Club World Cup Fixtures:");
    try {
      const fifaFixtures = await rapidApiService.getFixturesByLeague(15, 2025);
      console.log(`Found ${fifaFixtures.length} FIFA Club World Cup fixtures:`);

      if (fifaFixtures.length > 0) {
        fifaFixtures.slice(0, 10).forEach((fixture, index) => {
          const date = new Date(fixture.fixture.date).toLocaleString();
          const status = fixture.fixture.status.long;
          console.log(
            `\n${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          );
          console.log(`   Date: ${date}`);
          console.log(`   Status: ${status}`);
          console.log(`   Venue: ${fixture.fixture.venue?.name || "TBD"}`);
          if (fixture.goals.home !== null && fixture.goals.away !== null) {
            console.log(
              `   Score: ${fixture.goals.home} - ${fixture.goals.away}`,
            );
          }
        });

        if (fifaFixtures.length > 10) {
          console.log(`\n... and ${fifaFixtures.length - 10} more fixtures`);
        }
      }
    } catch (error) {
      console.error("Error fetching FIFA Club World Cup fixtures:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // 5. Get fixtures for UEFA U21 Championship (ID: 38)
    console.log("5. UEFA U21 Championship Fixtures:");
    try {
      const u21Fixtures = await rapidApiService.getFixturesByLeague(38, 2025);
      console.log(
        `Found ${u21Fixtures.length} UEFA U21 Championship fixtures:`,
      );

      if (u21Fixtures.length > 0) {
        u21Fixtures.slice(0, 10).forEach((fixture, index) => {
          const date = new Date(fixture.fixture.date).toLocaleString();
          const status = fixture.fixture.status.long;
          console.log(
            `\n${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          );
          console.log(`   Date: ${date}`);
          console.log(`   Status: ${status}`);
          console.log(`   Venue: ${fixture.fixture.venue?.name || "TBD"}`);
          if (fixture.goals.home !== null && fixture.goals.away !== null) {
            console.log(
              `   Score: ${fixture.goals.home} - ${fixture.goals.away}`,
            );
          }
        });

        if (u21Fixtures.length > 10) {
          console.log(`\n... and ${u21Fixtures.length - 10} more fixtures`);
        }
      }
    } catch (error) {
      console.error("Error fetching UEFA U21 Championship fixtures:", error);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // 6. Check tomorrow's date for any matches
    console.log(`6. Matches scheduled for tomorrow (${tomorrowDate}):`);
    try {
      const tomorrowFixtures = await rapidApiService.getFixturesByDate(
        tomorrowDate,
        true,
      );

      // Filter for FIFA Club World Cup and UEFA U21
      const relevantFixtures = tomorrowFixtures.filter(
        (fixture) => fixture.league.id === 15 || fixture.league.id === 38,
      );

      if (relevantFixtures.length > 0) {
        console.log(
          `Found ${relevantFixtures.length} relevant matches tomorrow:`,
        );
        relevantFixtures.forEach((fixture, index) => {
          const time = new Date(fixture.fixture.date).toLocaleTimeString();
          console.log(`\n${index + 1}. ${fixture.league.name}`);
          console.log(
            `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          );
          console.log(`   Time: ${time}`);
          console.log(`   Status: ${fixture.fixture.status.long}`);
        });
      } else {
        console.log("No FIFA Club World Cup or UEFA U21 matches tomorrow");
      }
    } catch (error) {
      console.error("Error checking tomorrow's matches:", error);
    }
  } catch (error) {
    console.error("Error checking leagues:", error);
  }

  console.log("\n=== Check Complete ===");
}

// Run the check
checkFifaAndEuroU21Leagues().catch(console.error);
