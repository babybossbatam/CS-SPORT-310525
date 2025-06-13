
import { rapidApiService } from "./services/rapidApi";

async function checkAllWorldLeagues() {
  console.log("=== Checking All World Country Leagues (Excluding Women's Leagues, Asia, China, and Africa) ===\n");

  try {
    // Get all available leagues
    console.log("🔍 Fetching all leagues from API...");
    const allLeagues = await rapidApiService.getLeagues();
    console.log(`📊 Total leagues available: ${allLeagues.length}\n`);

    // Filter for World country leagues (excluding women's leagues, Asia, China, and Africa)
    const worldLeagues = allLeagues.filter(leagueResponse => {
      const country = leagueResponse.country?.name || '';
      const leagueName = leagueResponse.league?.name?.toLowerCase() || '';
      
      // Include World, Europe, and International leagues
      const isWorldCountry = country === "World" || 
                            country === "Europe" || 
                            country === "International";
      
      // Exclude women's leagues
      const isWomensLeague = leagueName.includes('women') || 
                            leagueName.includes('female') || 
                            leagueName.includes('ladies');
      
      // Exclude Asia, China, and Africa regions
      const isExcludedRegion = country === "Asia" || 
                              country === "China" || 
                              country === "Africa";
      
      return isWorldCountry && !isWomensLeague && !isExcludedRegion;
    });

    console.log(`🌍 Found ${worldLeagues.length} World country leagues (excluding women's leagues, Asia, China, and Africa):\n`);

    // Group by league type for better organization
    const uefaLeagues = [];
    const fifaLeagues = [];
    const youthLeagues = [];
    const otherLeagues = [];

    worldLeagues.forEach(leagueResponse => {
      const leagueName = leagueResponse.league.name.toLowerCase();
      
      if (leagueName.includes("uefa") || leagueName.includes("euro")) {
        if (leagueName.includes("u21") || leagueName.includes("u19") || 
            leagueName.includes("u17") || leagueName.includes("youth") ||
            leagueName.includes("u23") || leagueName.includes("u20") ||
            leagueName.includes("u18") || leagueName.includes("u16")) {
          youthLeagues.push(leagueResponse);
        } else {
          uefaLeagues.push(leagueResponse);
        }
      } else if (leagueName.includes("fifa") || leagueName.includes("world cup")) {
        fifaLeagues.push(leagueResponse);
      } else {
        otherLeagues.push(leagueResponse);
      }
    });

    // Helper function to display leagues sorted by country and championship
    const displayLeaguesByCountryAndChampionship = (leagues: any[], categoryTitle: string) => {
      console.log(`\n${categoryTitle}:`);
      console.log("=" + "=".repeat(60));
      
      if (leagues.length === 0) {
        console.log(`❌ No ${categoryTitle.toLowerCase()} found`);
        return;
      }

      // Group by country first
      const groupedByCountry = leagues.reduce((acc, leagueResponse) => {
        const country = leagueResponse.country.name;
        if (!acc[country]) {
          acc[country] = [];
        }
        acc[country].push(leagueResponse);
        return acc;
      }, {});

      // Sort countries alphabetically
      const sortedCountries = Object.keys(groupedByCountry).sort();

      sortedCountries.forEach(country => {
        console.log(`\n📍 ${country.toUpperCase()}:`);
        console.log("-".repeat(40));
        
        // Sort championships within each country alphabetically
        const sortedLeagues = groupedByCountry[country].sort((a, b) => 
          a.league.name.localeCompare(b.league.name)
        );

        sortedLeagues.forEach((leagueResponse, index) => {
          console.log(`\n  ${index + 1}. ${leagueResponse.league.name}`);
          console.log(`     League ID: ${leagueResponse.league.id}`);
          console.log(`     Type: ${leagueResponse.league.type}`);
          console.log(`     Logo: ${leagueResponse.league.logo}`);
          if (leagueResponse.seasons && leagueResponse.seasons.length > 0) {
            const currentSeason = leagueResponse.seasons.find(s => s.current) || leagueResponse.seasons[0];
            console.log(`     Current Season: ${currentSeason.year} (${currentSeason.start} to ${currentSeason.end})`);
          }
        });
      });
    };

    // Display all categories sorted by country and championship
    displayLeaguesByCountryAndChampionship(uefaLeagues, "🏆 UEFA MAJOR LEAGUES");
    displayLeaguesByCountryAndChampionship(fifaLeagues, "🌍 FIFA LEAGUES");
    displayLeaguesByCountryAndChampionship(youthLeagues, "🏅 UEFA YOUTH LEAGUES");
    displayLeaguesByCountryAndChampionship(otherLeagues, "🌐 OTHER INTERNATIONAL LEAGUES");

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log("=" + "=".repeat(60));
    console.log(`Total World country leagues (excluding women's, Asia, China, and Africa): ${worldLeagues.length}`);
    console.log(`UEFA Major Leagues: ${uefaLeagues.length}`);
    console.log(`FIFA Leagues: ${fifaLeagues.length}`);
    console.log(`UEFA Youth Leagues: ${youthLeagues.length}`);
    console.log(`Other International Leagues: ${otherLeagues.length}`);

    // List all league IDs for easy reference
    console.log("\n🔢 ALL WORLD LEAGUE IDs (for reference):");
    console.log("=" + "=".repeat(60));
    const allWorldLeagueIds = worldLeagues.map(l => `${l.league.id} (${l.league.name})`);
    allWorldLeagueIds.forEach((leagueInfo, index) => {
      console.log(`${index + 1}. ${leagueInfo}`);
    });

  } catch (error) {
    console.error("❌ Error checking World leagues:", error);
  }

  console.log("\n✅ World Leagues Check Complete!");
}

// Run the check
checkAllWorldLeagues().then(() => {
  console.log("\n🏁 Script completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
