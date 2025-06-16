
import { sportsradarApi } from './services/sportsradarApi';
import { format } from 'date-fns';

async function checkSportsRadarTodayMatches() {
  console.log("=== Checking SportsRadar API for Today's World/International Matches ===\n");
  
  const today = new Date();
  const todayDate = format(today, "yyyy-MM-dd");
  console.log(`📅 Today's date: ${todayDate}\n`);

  try {
    // 1. First, let's get all sports to see what's available
    console.log("🌍 Step 1: Getting all available sports from SportsRadar...");
    try {
      const allSports = await sportsradarApi.getAllSports();
      console.log(`✅ Found ${allSports?.length || 0} sports:`, allSports?.slice(0, 5));
    } catch (error) {
      console.log("⚠️ Error getting all sports:", error);
    }

    // 2. Get football/soccer leagues specifically
    console.log("\n⚽ Step 2: Getting football/soccer leagues...");
    try {
      const footballLeagues = await sportsradarApi.getFootballLeagues();
      console.log(`✅ Found ${footballLeagues?.length || 0} football leagues`);
      
      if (footballLeagues && footballLeagues.length > 0) {
        // Filter for international/world competitions
        const internationalLeagues = footballLeagues.filter(league => {
          const name = league.name?.toLowerCase() || '';
          const category = league.category?.name?.toLowerCase() || '';
          
          return name.includes('world') || 
                 name.includes('international') || 
                 name.includes('uefa') || 
                 name.includes('fifa') || 
                 name.includes('champions') ||
                 name.includes('europa') ||
                 name.includes('nations') ||
                 category.includes('world') ||
                 category.includes('international');
        });

        console.log(`🌍 Found ${internationalLeagues.length} international competitions:`);
        internationalLeagues.slice(0, 10).forEach((league, index) => {
          console.log(`   ${index + 1}. ${league.name} (${league.category?.name || 'Unknown'})`);
        });

        if (internationalLeagues.length > 10) {
          console.log(`   ... and ${internationalLeagues.length - 10} more`);
        }
      }
    } catch (error) {
      console.log("⚠️ Error getting football leagues:", error);
    }

    // 3. Get fixtures for today
    console.log(`\n📅 Step 3: Getting fixtures for ${todayDate}...`);
    try {
      const todayFixtures = await sportsradarApi.getFixturesByDate(todayDate);
      console.log(`✅ Found ${todayFixtures?.length || 0} fixtures for today`);

      if (todayFixtures && todayFixtures.length > 0) {
        // Filter for World/International matches
        const worldMatches = todayFixtures.filter(fixture => {
          const tournament = fixture.tournament?.name?.toLowerCase() || '';
          const category = fixture.tournament?.category?.name?.toLowerCase() || '';
          
          return tournament.includes('world') || 
                 tournament.includes('international') || 
                 tournament.includes('uefa') || 
                 tournament.includes('fifa') || 
                 tournament.includes('champions') ||
                 tournament.includes('europa') ||
                 tournament.includes('nations') ||
                 category.includes('world') ||
                 category.includes('international');
        });

        console.log(`\n🌍 World/International matches today: ${worldMatches.length}`);
        
        if (worldMatches.length > 0) {
          worldMatches.forEach((match, index) => {
            const homeTeam = match.home_team?.name || 'Unknown';
            const awayTeam = match.away_team?.name || 'Unknown';
            const tournament = match.tournament?.name || 'Unknown Tournament';
            const status = match.status || 'Unknown';
            const scheduled = match.scheduled ? new Date(match.scheduled).toLocaleTimeString('en-GB') : 'TBD';
            const score = match.home_score !== undefined && match.away_score !== undefined 
              ? `${match.home_score} - ${match.away_score}` 
              : 'vs';

            console.log(`\n${index + 1}. ${tournament}`);
            console.log(`   ${homeTeam} ${score} ${awayTeam}`);
            console.log(`   Status: ${status} | Time: ${scheduled}`);
            if (match.venue?.name) {
              console.log(`   Venue: ${match.venue.name}, ${match.venue.city || 'Unknown City'}`);
            }
          });

          // Separate finished and live matches
          const finishedMatches = worldMatches.filter(m => 
            m.status?.toLowerCase().includes('finished') || 
            m.status?.toLowerCase().includes('ended') ||
            m.status?.toLowerCase().includes('ft')
          );
          
          const liveMatches = worldMatches.filter(m => 
            m.status?.toLowerCase().includes('live') || 
            m.status?.toLowerCase().includes('in progress') ||
            m.status?.toLowerCase().includes('1h') ||
            m.status?.toLowerCase().includes('2h')
          );

          const upcomingMatches = worldMatches.filter(m => 
            m.status?.toLowerCase().includes('not started') ||
            m.status?.toLowerCase().includes('scheduled')
          );

          console.log(`\n📊 Match Status Summary:`);
          console.log(`   ✅ Finished: ${finishedMatches.length}`);
          console.log(`   🔴 Live: ${liveMatches.length}`);
          console.log(`   ⏰ Upcoming: ${upcomingMatches.length}`);

          if (finishedMatches.length > 0) {
            console.log(`\n✅ FINISHED MATCHES TODAY:`);
            finishedMatches.forEach((match, index) => {
              const homeTeam = match.home_team?.name || 'Unknown';
              const awayTeam = match.away_team?.name || 'Unknown';
              const tournament = match.tournament?.name || 'Unknown Tournament';
              const score = `${match.home_score || 0} - ${match.away_score || 0}`;
              console.log(`   ${index + 1}. ${tournament}: ${homeTeam} ${score} ${awayTeam}`);
            });
          }

          if (liveMatches.length > 0) {
            console.log(`\n🔴 LIVE MATCHES NOW:`);
            liveMatches.forEach((match, index) => {
              const homeTeam = match.home_team?.name || 'Unknown';
              const awayTeam = match.away_team?.name || 'Unknown';
              const tournament = match.tournament?.name || 'Unknown Tournament';
              const score = `${match.home_score || 0} - ${match.away_score || 0}`;
              console.log(`   ${index + 1}. ${tournament}: ${homeTeam} ${score} ${awayTeam} (${match.status})`);
            });
          }

        } else {
          console.log("❌ No World/International matches found for today");
        }
      }
    } catch (error) {
      console.log("⚠️ Error getting today's fixtures:", error);
    }

    // 4. Try to get live fixtures specifically
    console.log(`\n🔴 Step 4: Getting live fixtures...`);
    try {
      const liveFixtures = await sportsradarApi.getLiveFixtures();
      console.log(`✅ Found ${liveFixtures?.length || 0} live fixtures`);

      if (liveFixtures && liveFixtures.length > 0) {
        const worldLiveMatches = liveFixtures.filter(fixture => {
          const tournament = fixture.tournament?.name?.toLowerCase() || '';
          const category = fixture.tournament?.category?.name?.toLowerCase() || '';
          
          return tournament.includes('world') || 
                 tournament.includes('international') || 
                 tournament.includes('uefa') || 
                 tournament.includes('fifa') || 
                 tournament.includes('champions') ||
                 tournament.includes('europa') ||
                 tournament.includes('nations') ||
                 category.includes('world') ||
                 category.includes('international');
        });

        console.log(`🌍 Live World/International matches: ${worldLiveMatches.length}`);
        
        if (worldLiveMatches.length > 0) {
          worldLiveMatches.forEach((match, index) => {
            const homeTeam = match.home_team?.name || 'Unknown';
            const awayTeam = match.away_team?.name || 'Unknown';
            const tournament = match.tournament?.name || 'Unknown Tournament';
            const score = `${match.home_score || 0} - ${match.away_score || 0}`;
            console.log(`   ${index + 1}. ${tournament}: ${homeTeam} ${score} ${awayTeam} (LIVE)`);
          });
        }
      }
    } catch (error) {
      console.log("⚠️ Error getting live fixtures:", error);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 SPORTSRADAR API SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ SportsRadar API check completed");
    console.log("💡 Note: SportsRadar may have limited public access");
    console.log("💡 Some endpoints might require premium subscription");
    console.log("💡 Consider using RapidAPI (which you already have) as primary source");

  } catch (error) {
    console.error("❌ Error checking SportsRadar API:", error);
    console.log("\n💡 Alternative: Your RapidAPI service is working well for World matches");
    console.log("💡 Check your existing World matches in TodayPopularFootballLeaguesNew.tsx");
  }
}

// Run the check
checkSportsRadarTodayMatches().then(() => {
  console.log("\n✅ SportsRadar check completed!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
