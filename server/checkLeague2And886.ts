
import { rapidApiService } from "./services/rapidApi";
import { format } from "date-fns";

async function checkLeagues2And886Today() {
  console.log("🔍 Checking League IDs 2 and 886 for today's matches...\n");
  
  const today = new Date();
  const todayDate = format(today, "yyyy-MM-dd");
  console.log(`📅 Today's date: ${todayDate}\n`);

  const leagueIds = [2, 886];

  for (const leagueId of leagueIds) {
    try {
      console.log(`🏆 Fetching league information for ID ${leagueId}...`);
      const leagueInfo = await rapidApiService.getLeagueById(leagueId);
      
      if (leagueInfo) {
        console.log(`✅ League Name: ${leagueInfo.league.name}`);
        console.log(`🌍 Country: ${leagueInfo.country.name}`);
        console.log(`📊 Type: ${leagueInfo.league.type}`);
        console.log(`🏟️ Season: ${leagueInfo.seasons?.[0]?.year || 'N/A'}\n`);
      } else {
        console.log(`❌ League with ID ${leagueId} not found\n`);
        continue;
      }

      // Get all fixtures for today
      console.log(`🔍 Fetching all fixtures for today...`);
      const allFixtures = await rapidApiService.getFixturesByDate(todayDate, true);
      console.log(`📊 Total fixtures available today: ${allFixtures.length}`);

      // Filter for current league
      const leagueFixtures = allFixtures.filter(fixture => 
        fixture.league.id === leagueId
      );

      console.log(`🎯 League ${leagueId} fixtures today: ${leagueFixtures.length}\n`);

      if (leagueFixtures.length === 0) {
        console.log(`❌ No matches found for League ${leagueId} today`);
        
        // Check if league has any fixtures at all
        console.log(`\n🔍 Checking league fixtures for current season...`);
        try {
          const leagueSeasonFixtures = await rapidApiService.getFixturesByLeague(leagueId, 2025);
          console.log(`📈 Total fixtures for league ${leagueId} in 2025: ${leagueSeasonFixtures?.length || 0}`);
          
          if (leagueSeasonFixtures && leagueSeasonFixtures.length > 0) {
            // Show next upcoming match
            const upcomingMatches = leagueSeasonFixtures
              .filter(f => f.fixture.status.short === 'NS' && new Date(f.fixture.date) > new Date())
              .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
              .slice(0, 3);
              
            if (upcomingMatches.length > 0) {
              console.log(`\n⏰ Next upcoming matches for League ${leagueId}:`);
              upcomingMatches.forEach((fixture, index) => {
                const matchDate = new Date(fixture.fixture.date);
                console.log(`${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                console.log(`   📅 ${matchDate.toLocaleString()}`);
                console.log(`   🏟️ ${fixture.fixture.venue?.name || 'TBD'}`);
                console.log('');
              });
            }
            
            // Show recent finished matches
            const recentMatches = leagueSeasonFixtures
              .filter(f => f.fixture.status.short === 'FT')
              .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
              .slice(0, 3);
              
            if (recentMatches.length > 0) {
              console.log(`\n✅ Recent results for League ${leagueId}:`);
              recentMatches.forEach((fixture, index) => {
                const matchDate = new Date(fixture.fixture.date);
                console.log(`${index + 1}. ${fixture.teams.home.name} ${fixture.goals.home}-${fixture.goals.away} ${fixture.teams.away.name}`);
                console.log(`   📅 ${matchDate.toLocaleDateString()}`);
                console.log('');
              });
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching league fixtures for ${leagueId}:`, error);
        }
        
        console.log("\n" + "=".repeat(70));
        continue;
      }

      // Display today's matches for current league
      console.log(`📋 Today's matches for League ${leagueId}:`);
      console.log("=" + "=".repeat(60));
      
      leagueFixtures.forEach((fixture, index) => {
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

      // Summary for this league
      console.log("\n" + "=".repeat(70));
      console.log(`📊 SUMMARY FOR LEAGUE ${leagueId}:`);
      const liveMatches = leagueFixtures.filter(f => ['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.fixture.status.short));
      const upcomingMatches = leagueFixtures.filter(f => f.fixture.status.short === 'NS');
      const finishedMatches = leagueFixtures.filter(f => f.fixture.status.short === 'FT');
      
      console.log(`🔴 Live matches: ${liveMatches.length}`);
      console.log(`⏰ Upcoming matches: ${upcomingMatches.length}`);
      console.log(`✅ Finished matches: ${finishedMatches.length}`);
      console.log(`📈 Total matches today: ${leagueFixtures.length}`);
      console.log("\n" + "=".repeat(70));

    } catch (error) {
      console.error(`❌ Error checking League ${leagueId}:`, error);
    }
  }

  console.log("\n✅ League check completed for both leagues!");
}

// Run the check
checkLeagues2And886Today().then(() => {
  console.log("\n🏁 Script completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
