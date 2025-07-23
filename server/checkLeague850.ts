
import { rapidApiService } from "./services/rapidApi";
import { format } from "date-fns";

async function checkLeague850Today() {
  console.log("🔍 Checking League ID 850 for today's matches...\n");
  
  const today = new Date();
  const todayDate = format(today, "yyyy-MM-dd");
  console.log(`📅 Today's date: ${todayDate}\n`);

  try {
    // First, get league information
    console.log("🏆 Fetching league information for ID 850...");
    const leagueInfo = await rapidApiService.getLeagueById(850);
    
    if (leagueInfo) {
      console.log(`✅ League Name: ${leagueInfo.league.name}`);
      console.log(`🌍 Country: ${leagueInfo.country.name}`);
      console.log(`📊 Type: ${leagueInfo.league.type}`);
      console.log(`🏟️ Season: ${leagueInfo.seasons?.[0]?.year || 'N/A'}\n`);
    } else {
      console.log(`❌ League with ID 850 not found\n`);
    }

    // Get all fixtures for today
    console.log("🔍 Fetching all fixtures for today...");
    const allFixtures = await rapidApiService.getFixturesByDate(todayDate, true);
    console.log(`📊 Total fixtures available today: ${allFixtures.length}\n`);

    // Filter for league 850
    const league850Fixtures = allFixtures.filter(fixture => 
      fixture.league.id === 850
    );

    console.log(`🎯 League 850 fixtures today: ${league850Fixtures.length}\n`);

    if (league850Fixtures.length === 0) {
      console.log("❌ No matches found for League 850 today");
      
      // Check if league has any fixtures at all
      console.log("\n🔍 Checking league fixtures for current season...");
      try {
        const leagueFixtures = await rapidApiService.getFixturesByLeague(850, 2025);
        console.log(`📈 Total fixtures for league 850 in 2025: ${leagueFixtures?.length || 0}`);
        
        if (leagueFixtures && leagueFixtures.length > 0) {
          // Show next upcoming match
          const upcomingMatches = leagueFixtures
            .filter(f => f.fixture.status.short === 'NS' && new Date(f.fixture.date) > new Date())
            .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
            .slice(0, 3);
            
          if (upcomingMatches.length > 0) {
            console.log(`\n⏰ Next upcoming matches for League 850:`);
            upcomingMatches.forEach((fixture, index) => {
              const matchDate = new Date(fixture.fixture.date);
              console.log(`${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
              console.log(`   📅 ${matchDate.toLocaleString()}`);
              console.log(`   🏟️ ${fixture.fixture.venue?.name || 'TBD'}`);
              console.log('');
            });
          }
          
          // Show recent finished matches
          const recentMatches = leagueFixtures
            .filter(f => f.fixture.status.short === 'FT')
            .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
            .slice(0, 3);
            
          if (recentMatches.length > 0) {
            console.log(`\n✅ Recent results for League 850:`);
            recentMatches.forEach((fixture, index) => {
              const matchDate = new Date(fixture.fixture.date);
              console.log(`${index + 1}. ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name}`);
              console.log(`   📅 ${matchDate.toLocaleDateString()}`);
              console.log('');
            });
          }
        }
      } catch (error) {
        console.error("❌ Error fetching league fixtures:", error);
      }
      
      return;
    }

    // Display today's matches for league 850
    console.log("📋 Today's matches for League 850:");
    console.log("=" + "=".repeat(60));
    
    league850Fixtures.forEach((fixture, index) => {
      const date = new Date(fixture.fixture.date);
      const time = date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const status = fixture.fixture.status.long;
      const statusShort = fixture.fixture.status.short;
      
      console.log(`\n${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`   ⏰ Time: ${time}`);
      console.log(`   📊 Status: ${status} (${statusShort})`);
      console.log(`   🏟️ Venue: ${fixture.fixture.venue?.name || 'TBD'}`);
      console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
      
      if (fixture.goals.home !== null && fixture.goals.away !== null) {
        console.log(`   ⚽ Score: ${fixture.goals.home} - ${fixture.goals.away}`);
      }
      
      // Show elapsed time for live matches
      if (['1H', '2H', 'HT', 'ET'].includes(statusShort) && fixture.fixture.status.elapsed) {
        console.log(`   ⏱️ Elapsed: ${fixture.fixture.status.elapsed}'`);
      }
    });

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 SUMMARY:");
    const liveMatches = league850Fixtures.filter(f => ['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.fixture.status.short));
    const upcomingMatches = league850Fixtures.filter(f => f.fixture.status.short === 'NS');
    const finishedMatches = league850Fixtures.filter(f => f.fixture.status.short === 'FT');
    
    console.log(`🔴 Live matches: ${liveMatches.length}`);
    console.log(`⏰ Upcoming matches: ${upcomingMatches.length}`);
    console.log(`✅ Finished matches: ${finishedMatches.length}`);
    console.log(`📈 Total matches today: ${league850Fixtures.length}`);

  } catch (error) {
    console.error("❌ Error checking League 850:", error);
  }

  console.log("\n✅ League 850 check completed!");
}

// Run the check
checkLeague850Today().then(() => {
  console.log("\n🏁 Script completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
