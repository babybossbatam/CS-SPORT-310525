
import { rapidApiService } from './services/rapidApi';

// Function to check matches for a specific league ID
async function checkLeagueMatches(leagueId: number, season: number = 2025) {
  try {
    console.log(`\n🔍 Checking matches for League ID: ${leagueId}`);
    console.log(`📅 Season: ${season}`);
    console.log('═'.repeat(80));

    // First get league info
    const leagueInfo = await rapidApiService.getLeagueById(leagueId);
    if (!leagueInfo) {
      console.log(`❌ League with ID ${leagueId} not found`);
      return;
    }

    console.log(`🏆 League: ${leagueInfo.league.name}`);
    console.log(`🌍 Country: ${leagueInfo.country.name}`);
    console.log(`📊 Type: ${leagueInfo.league.type}`);

    // Get fixtures for the league
    const fixtures = await rapidApiService.getFixturesByLeague(leagueId, season);
    
    if (!fixtures || fixtures.length === 0) {
      console.log(`📭 No fixtures found for league ${leagueId} in season ${season}`);
      return;
    }

    console.log(`\n📊 Found ${fixtures.length} matches:`);
    console.log('─'.repeat(80));

    // Group matches by status
    const liveMatches = fixtures.filter(f => ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.fixture.status.short));
    const upcomingMatches = fixtures.filter(f => f.fixture.status.short === 'NS' && new Date(f.fixture.date) > new Date());
    const finishedMatches = fixtures.filter(f => f.fixture.status.short === 'FT');

    // Show live matches first
    if (liveMatches.length > 0) {
      console.log(`\n🔴 LIVE MATCHES (${liveMatches.length}):`);
      liveMatches.forEach((fixture, index) => {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const homeScore = fixture.goals.home ?? 0;
        const awayScore = fixture.goals.away ?? 0;
        const status = fixture.fixture.status.short;
        const elapsed = fixture.fixture.status.elapsed;
        
        console.log(`${index + 1}. ${homeTeam} ${homeScore}-${awayScore} ${awayTeam} [${status}${elapsed ? ` ${elapsed}'` : ''}]`);
        console.log(`   📅 ${new Date(fixture.fixture.date).toLocaleString()}`);
        console.log(`   🏟️ ${fixture.fixture.venue?.name || 'TBD'}`);
        console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
        console.log('');
      });
    }

    // Show next 5 upcoming matches
    if (upcomingMatches.length > 0) {
      console.log(`\n⏰ UPCOMING MATCHES (Next 5 of ${upcomingMatches.length}):`);
      const nextMatches = upcomingMatches
        .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .slice(0, 5);
        
      nextMatches.forEach((fixture, index) => {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const matchDate = new Date(fixture.fixture.date);
        
        console.log(`${index + 1}. ${homeTeam} vs ${awayTeam}`);
        console.log(`   📅 ${matchDate.toLocaleString()}`);
        console.log(`   🏟️ ${fixture.fixture.venue?.name || 'TBD'}`);
        console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
        console.log('');
      });
    }

    // Show last 3 finished matches
    if (finishedMatches.length > 0) {
      console.log(`\n✅ RECENT RESULTS (Last 3 of ${finishedMatches.length}):`);
      const recentMatches = finishedMatches
        .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
        .slice(0, 3);
        
      recentMatches.forEach((fixture, index) => {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const homeScore = fixture.goals.home ?? 0;
        const awayScore = fixture.goals.away ?? 0;
        const matchDate = new Date(fixture.fixture.date);
        
        console.log(`${index + 1}. ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`);
        console.log(`   📅 ${matchDate.toLocaleDateString()}`);
        console.log(`   🏟️ ${fixture.fixture.venue?.name || 'Unknown'}`);
        console.log(`   🆔 Fixture ID: ${fixture.fixture.id}`);
        console.log('');
      });
    }

    console.log('═'.repeat(80));
    console.log(`📊 Summary for ${leagueInfo.league.name}:`);
    console.log(`   🔴 Live: ${liveMatches.length}`);
    console.log(`   ⏰ Upcoming: ${upcomingMatches.length}`);
    console.log(`   ✅ Finished: ${finishedMatches.length}`);
    console.log(`   📈 Total: ${fixtures.length}`);

  } catch (error) {
    console.error(`❌ Error checking league ${leagueId}:`, error);
  }
}

// Function to check multiple leagues
async function checkMultipleLeagues(leagueIds: number[], season: number = 2025) {
  console.log(`\n🔍 Checking ${leagueIds.length} leagues for season ${season}`);
  console.log('═'.repeat(100));
  
  for (const leagueId of leagueIds) {
    await checkLeagueMatches(leagueId, season);
    console.log('\n');
  }
}

// Main execution
async function main() {
  // Check the requested leagues
  const leagueIdsToCheck = [
    38,   // UEFA U21 Championship
    15,   // FIFA Club World Cup
  ];

  console.log('🚀 Starting League Match Checker for requested leagues...');
  
  // Check multiple leagues
  await checkMultipleLeagues(leagueIdsToCheck);
  
  console.log('\n✅ League check completed!');
}

// Run the script
main().catch(console.error);
