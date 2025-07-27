
/**
 * Logo System Test Utility
 * Tests different logo endpoints and caching
 */

export async function testLogoEndpoints(): Promise<void> {
  console.log('🧪 [Logo Test] Starting logo system test...');
  
  const testLeagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
  const testTeams = [33, 529, 489, 157, 85]; // Manchester United, Barcelona, AC Milan, Bayern Munich, PSG
  
  // Test league logos
  console.log('🏆 [Logo Test] Testing league logos...');
  for (const leagueId of testLeagues) {
    try {
      const response = await fetch(`/api/league-logo/square/${leagueId}`);
      console.log(`League ${leagueId}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`League ${leagueId} failed:`, error);
    }
  }
  
  // Test team logos
  console.log('🏟️ [Logo Test] Testing team logos...');
  for (const teamId of testTeams) {
    try {
      const response = await fetch(`/api/team-logo/square/${teamId}`);
      console.log(`Team ${teamId}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`Team ${teamId} failed:`, error);
    }
  }
  
  // Test direct API-Sports URLs
  console.log('🌐 [Logo Test] Testing direct API-Sports URLs...');
  for (const leagueId of testLeagues.slice(0, 2)) {
    try {
      const img = new Image();
      img.onload = () => console.log(`✅ Direct league ${leagueId} loaded successfully`);
      img.onerror = () => console.log(`❌ Direct league ${leagueId} failed to load`);
      img.src = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
    } catch (error) {
      console.error(`Direct league ${leagueId} failed:`, error);
    }
  }
  
  console.log('🧪 [Logo Test] Test completed - check console for results');
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).testLogos = testLogoEndpoints;
}

export default testLogoEndpoints;
