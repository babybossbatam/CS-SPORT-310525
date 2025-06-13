
import { rapidApiService } from "./services/rapidApi";

async function checkTodayInternationalLeagues() {
  console.log("=== Checking Today's Matches for International Leagues ===\n");

  // All the league IDs from your list
  const internationalLeagues = [
    { id: 4, name: "Euro Championship" },
    { id: 21, name: "Confederations Cup" },
    { id: 1, name: "World Cup" },
    { id: 803, name: "Asian Games" },
    { id: 804, name: "Caribbean Cup" },
    { id: 2, name: "UEFA Champions League" },
    { id: 7, name: "Asian Cup" },
    { id: 15, name: "FIFA Club World Cup" },
    { id: 480, name: "Olympics Men" },
    { id: 535, name: "CECAFA Senior Challenge Cup" },
    { id: 28, name: "SAFF Championship" },
    { id: 3, name: "UEFA Europa League" },
    { id: 37, name: "World Cup - Qualification Intercontinental Play-offs" },
    { id: 807, name: "AFC Challenge Cup" },
    { id: 19, name: "African Nations Championship" },
    { id: 24, name: "AFF Championship" },
    { id: 22, name: "CONCACAF Gold Cup" },
    { id: 23, name: "EAFF E-1 Football Championship" },
    { id: 27, name: "OFC Champions League" },
    { id: 6, name: "Africa Cup of Nations" },
    { id: 9, name: "Copa America" },
    { id: 531, name: "UEFA Super Cup" },
    { id: 16, name: "CONCACAF Champions League" },
    { id: 17, name: "AFC Champions League" },
    { id: 25, name: "Gulf Cup of Nations" },
    { id: 26, name: "International Champions Cup" },
    { id: 805, name: "Copa Centroamericana" },
    { id: 806, name: "OFC Nations Cup" },
    { id: 766, name: "China Cup" },
    { id: 10, name: "Friendlies" },
    { id: 14, name: "UEFA Youth League" },
    { id: 18, name: "AFC Cup" },
    { id: 20, name: "CAF Confederation Cup" },
    { id: 38, name: "UEFA U21 Championship" },
    { id: 490, name: "World Cup - U20" },
    { id: 5, name: "UEFA Nations League" },
    { id: 808, name: "CONCACAF Nations League - Qualification" },
    { id: 31, name: "World Cup - Qualification CONCACAF" },
    { id: 32, name: "World Cup - Qualification Europe" },
    { id: 33, name: "World Cup - Qualification Oceania" },
    { id: 34, name: "World Cup - Qualification South America" },
    { id: 29, name: "World Cup - Qualification Africa" },
    { id: 30, name: "World Cup - Qualification Asia" },
    { id: 493, name: "UEFA U19 Championship" },
    { id: 537, name: "CONCACAF U20" },
    { id: 35, name: "Asian Cup - Qualification" },
    { id: 533, name: "CAF Super Cup" },
    { id: 534, name: "CONCACAF Caribbean Club Shield" },
    { id: 11, name: "CONMEBOL Sudamericana" },
    { id: 12, name: "CAF Champions League" },
    { id: 13, name: "CONMEBOL Libertadores" },
    { id: 768, name: "Arab Club Champions Cup" },
    { id: 769, name: "Premier League Asia Trophy" },
    { id: 770, name: "Pacific Games" },
    { id: 772, name: "Leagues Cup" },
    { id: 773, name: "Sudamericano U20" },
    { id: 587, name: "World Cup - U17" },
    { id: 767, name: "CONCACAF League" },
    { id: 771, name: "COSAFA U20 Championship" },
    { id: 849, name: "Baltic Cup" },
    { id: 532, name: "AFC U23 Asian Cup" },
    { id: 536, name: "CONCACAF Nations League" },
    { id: 538, name: "Africa Cup of Nations U20" },
    { id: 540, name: "CONMEBOL Libertadores U20" },
    { id: 541, name: "CONMEBOL Recopa" },
    { id: 881, name: "Olympics Men - Qualification Concacaf" },
    { id: 885, name: "Campeones Cup" },
    { id: 667, name: "Friendlies Clubs" },
    { id: 848, name: "UEFA Europa Conference League" },
    { id: 856, name: "CONCACAF Caribbean Club Championship" },
    { id: 858, name: "CONCACAF Gold Cup - Qualification" },
    { id: 859, name: "COSAFA Cup" },
    { id: 860, name: "Arab Cup" },
    { id: 910, name: "Youth Viareggio Cup" },
    { id: 869, name: "CECAFA Club Cup" },
    { id: 890, name: "U20 Elite League" },
    { id: 902, name: "Algarve Cup" },
    { id: 903, name: "The Atlantic Cup" },
    { id: 36, name: "Africa Cup of Nations - Qualification" },
    { id: 949, name: "CONMEBOL Libertadores Femenina" },
    { id: 951, name: "South American Youth Games" },
    { id: 952, name: "AFC U23 Asian Cup - Qualification" },
    { id: 953, name: "Africa U23 Cup of Nations - Qualification" },
    { id: 886, name: "UEFA U17 Championship - Qualification" },
    { id: 893, name: "UEFA U19 Championship - Qualification" },
    { id: 900, name: "Tipsport Malta Cup" },
    { id: 904, name: "SheBelieves Cup" },
    { id: 1016, name: "CAC Games" },
    { id: 908, name: "AFF U23 Championship" },
    { id: 911, name: "Southeast Asian Games" },
    { id: 913, name: "CONMEBOL - UEFA Finalissima" },
    { id: 914, name: "Tournoi Maurice Revello" },
    { id: 916, name: "Kirin Cup" },
    { id: 919, name: "Mediterranean Games" },
    { id: 921, name: "UEFA U17 Championship" },
    { id: 926, name: "Copa America Femenina" },
    { id: 928, name: "AFF U19 Championship" },
    { id: 934, name: "Arab Championship - U20" },
    { id: 937, name: "Emirates Cup" },
    { id: 940, name: "COTIF Tournament" },
    { id: 941, name: "Islamic Solidarity Games" },
    { id: 1038, name: "King's Cup" },
    { id: 1039, name: "Premier League International Cup" },
    { id: 1043, name: "African Football League" },
    { id: 1045, name: "Pan American Games" },
    { id: 1072, name: "All Africa Games" },
    { id: 960, name: "Euro Championship - Qualification" },
    { id: 963, name: "CONCACAF U17" },
    { id: 965, name: "AFC U20 Asian Cup" },
    { id: 970, name: "CONMEBOL - U17" },
    { id: 973, name: "CAF Cup of Nations - U17" },
    { id: 1008, name: "CAFA Nations Cup" },
    { id: 1012, name: "AFC U17 Asian Cup" },
    { id: 1015, name: "CAF U23 Cup of Nations" },
    { id: 1024, name: "UEFA - CONMEBOL - Club Challenge" },
    { id: 1028, name: "Concacaf Central American Cup" },
    { id: 850, name: "UEFA U21 Championship - Qualification" },
    { id: 1153, name: "AFC U20 Asian Cup - Qualification" },
    { id: 1159, name: "CECAFA U20 Championship" },
    { id: 1161, name: "AFC U17 Asian Cup - Qualification" },
    { id: 1162, name: "AGCFF Gulf Champions League" },
    { id: 1163, name: "African Nations Championship - Qualification" },
    { id: 1060, name: "CONMEBOL - Pre-Olympic Tournament" },
    { id: 1066, name: "CONCACAF U20 - Qualification" },
    { id: 1077, name: "WAFF Championship U23" },
    { id: 1081, name: "CONMEBOL - U17 Femenino" },
    { id: 1085, name: "CONMEBOL U20 Femenino" },
    { id: 1089, name: "UAE-Qatar - Super Shield" },
    { id: 1105, name: "Olympics - Intercontinental Play-offs" },
    { id: 1122, name: "OFC U19 Championship" },
    { id: 1123, name: "Qatar-UAE Super Cup" },
    { id: 1129, name: "ASEAN Club Championship" },
    { id: 1132, name: "AFC Challenge League" },
    { id: 1136, name: "CONCACAF W Champions Cup" },
    { id: 1168, name: "FIFA Intercontinental Cup" },
    { id: 1169, name: "EAFF E-1 Football Championship - Qualification" },
    { id: 1186, name: "FIFA Club World Cup - Play-In" }
  ];

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Checking for matches on: ${today}\n`);

    const leaguesWithMatches: any[] = [];
    let totalMatches = 0;

    // Check each league for today's fixtures
    for (let i = 0; i < internationalLeagues.length; i++) {
      const league = internationalLeagues[i];
      
      try {
        console.log(`🔍 Checking League ${i + 1}/${internationalLeagues.length}: ${league.name} (ID: ${league.id})`);
        
        const fixtures = await rapidApiService.getFixturesByDate(today, undefined, league.id);
        
        if (fixtures && fixtures.length > 0) {
          console.log(`✅ Found ${fixtures.length} match(es) in ${league.name}`);
          
          leaguesWithMatches.push({
            ...league,
            fixtures: fixtures
          });
          
          totalMatches += fixtures.length;

          // Show match details
          fixtures.forEach((fixture: any, index: number) => {
            const time = new Date(fixture.fixture.date).toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const status = fixture.fixture.status.long;
            
            console.log(`   ${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
            console.log(`      Time: ${time} | Status: ${status}`);
            if (fixture.goals.home !== null && fixture.goals.away !== null) {
              console.log(`      Score: ${fixture.goals.home} - ${fixture.goals.away}`);
            }
          });
          console.log();
        } else {
          console.log(`❌ No matches found in ${league.name}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`⚠️ Error checking ${league.name}: ${error}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    
    if (leaguesWithMatches.length > 0) {
      console.log(`✅ Found matches in ${leaguesWithMatches.length} international league(s)`);
      console.log(`🏆 Total matches today: ${totalMatches}\n`);

      console.log("🌍 LEAGUES WITH MATCHES TODAY:");
      leaguesWithMatches.forEach((league, index) => {
        console.log(`${index + 1}. ${league.name} (ID: ${league.id}) - ${league.fixtures.length} match(es)`);
      });

      console.log("\n🔥 MAJOR COMPETITIONS WITH MATCHES:");
      const majorCompetitions = leaguesWithMatches.filter(league => 
        [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 15, 16, 17, 480, 848].includes(league.id)
      );
      
      if (majorCompetitions.length > 0) {
        majorCompetitions.forEach(league => {
          console.log(`🏆 ${league.name} - ${league.fixtures.length} match(es)`);
        });
      } else {
        console.log("❌ No major competitions have matches today");
      }

    } else {
      console.log("❌ No matches found in any international leagues today");
      console.log("💡 This could mean:");
      console.log("   - It's an off-season period for international competitions");
      console.log("   - Most international tournaments are not currently active");
      console.log("   - Check domestic leagues for today's matches");
    }

  } catch (error) {
    console.error("❌ Error checking international leagues:", error);
  }
}

// Run the check
checkTodayInternationalLeagues().then(() => {
  console.log("\n✅ International leagues check completed!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
