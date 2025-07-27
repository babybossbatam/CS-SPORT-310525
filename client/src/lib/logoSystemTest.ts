
export async function testLeagueLogos(): Promise<void> {
  console.log('🧪 [logoSystemTest] Testing league logo system...');
  
  const testLeagues = [
    { id: 39, name: 'Premier League' },
    { id: 140, name: 'La Liga' },
    { id: 135, name: 'Serie A' },
    { id: 78, name: 'Bundesliga' },
    { id: 61, name: 'Ligue 1' }
  ];

  for (const league of testLeagues) {
    console.log(`🔍 [logoSystemTest] Testing league ${league.name} (${league.id})...`);
    
    const sources = [
      `/api/league-logo/square/${league.id}`,
      `https://media.api-sports.io/football/leagues/${league.id}.png`,
      `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitions:default1.png/v12/Competitions/${league.id}`
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ [logoSystemTest] ${league.name}: Working source - ${source}`);
          break;
        } else {
          console.log(`❌ [logoSystemTest] ${league.name}: Failed source - ${source} (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ [logoSystemTest] ${league.name}: Error with source - ${source}`, error);
      }
    }
  }
  
  console.log('🧪 [logoSystemTest] League logo testing completed');
}

export function testSpecificLeagueLogo(leagueId: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const testUrl = `/api/league-logo/square/${leagueId}`;
    
    img.onload = () => {
      console.log(`✅ [logoSystemTest] League ${leagueId} logo loaded successfully`);
      resolve(testUrl);
    };
    
    img.onerror = () => {
      console.log(`❌ [logoSystemTest] League ${leagueId} logo failed to load`);
      resolve('/assets/fallback-logo.svg');
    };
    
    img.src = testUrl;
  });
}
