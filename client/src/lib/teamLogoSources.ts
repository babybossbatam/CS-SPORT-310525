
/**
 * Enhanced team logo sources with 365scores integration
 */

export interface TeamLogoSource {
  url: string;
  source: string;
  priority: number;
}

export interface TeamData {
  id?: number | string;
  name?: string;
  logo?: string;
}

/**
 * Generate team logo sources with improved reliability
 */
export function getTeamLogoSources(team: TeamData, isNationalTeam = false): TeamLogoSource[] {
  const sources: TeamLogoSource[] = [];
  
  // For national teams, prioritize API-Sports original logo first
  if (isNationalTeam && team?.logo && typeof team.logo === 'string' && team.logo.trim() !== '') {
    sources.push({
      url: team.logo,
      source: 'api-sports-original',
      priority: 1
    });
  }
  
  // For regular teams, prioritize original logo
  if (!isNationalTeam && team?.logo && typeof team.logo === 'string' && team.logo.trim() !== '') {
    sources.push({
      url: team.logo,
      source: 'api-sports-original',
      priority: 1
    });
  }

  // For national teams, add 365scores as secondary option with ID validation
  if (isNationalTeam && team?.id && team.id > 0) {
    sources.push({
      url: `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${team.id}`,
      source: '365scores',
      priority: 2
    });
  }

  // Alternative API sources if team ID is available
  if (team?.id) {
    // API-Sports alternative
    sources.push({
      url: `https://media.api-sports.io/football/teams/${team.id}.png`,
      source: 'api-sports-alternative',
      priority: 3
    });

    // SportMonks alternative
    sources.push({
      url: `https://cdn.sportmonks.com/images/soccer/teams/${team.id}.png`,
      source: 'sportmonks',
      priority: 4
    });

    // If not tried yet, add 365scores as fallback for regular teams too
    if (!isNationalTeam) {
      sources.push({
        url: `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${team.id}`,
        source: '365scores-fallback',
        priority: 5
      });
    }
  }

  // Final fallback
  sources.push({
    url: '/assets/fallback-logo.png',
    source: 'fallback',
    priority: 999
  });

  return sources.sort((a, b) => a.priority - b.priority);
}

/**
 * Check if team is likely a national team
 */
export function isNationalTeam(team: TeamData, league?: any): boolean {
  const teamName = team?.name?.toLowerCase() || '';
  const leagueName = league?.name?.toLowerCase() || '';
  const country = league?.country?.toLowerCase() || '';
  
  // Common national team names
  const nationalTeamNames = [
    'spain', 'france', 'england', 'germany', 'italy', 'portugal', 'brazil', 
    'argentina', 'netherlands', 'belgium', 'croatia', 'morocco', 'japan',
    'south korea', 'mexico', 'poland', 'denmark', 'switzerland', 'austria',
    'czech republic', 'ukraine', 'sweden', 'wales', 'scotland', 'norway'
  ];
  
  const isDirectNationalTeam = nationalTeamNames.some(name => 
    teamName === name || teamName === `${name} national team`
  );
  
  return (
    isDirectNationalTeam ||
    teamName.includes('national') ||
    teamName.includes(' u20') ||
    teamName.includes(' u21') ||
    teamName.includes(' u23') ||
    teamName.endsWith(' w') || // Women's teams
    country === 'world' ||
    country === 'europe' ||
    leagueName.includes('international') ||
    leagueName.includes('world cup') ||
    leagueName.includes('euro') ||
    leagueName.includes('copa america') ||
    leagueName.includes('uefa') ||
    leagueName.includes('conmebol') ||
    leagueName.includes('nations league') ||
    leagueName.includes('friendlies')
  );
}

/**
 * Create enhanced error handler for team logos with validation
 */
export function createTeamLogoErrorHandler(team: TeamData, isNationalTeam = false) {
  const sources = getTeamLogoSources(team, isNationalTeam);
  let currentIndex = 0;

  return function handleError(event: any) {
    const img = event.target as HTMLImageElement;
    const currentSrc = img.src;
    
    // Find current source index
    const currentSourceIndex = sources.findIndex(source => currentSrc.includes(source.url.split('/').pop() || ''));
    if (currentSourceIndex >= 0) {
      currentIndex = currentSourceIndex + 1;
    } else {
      currentIndex++;
    }

    // Try next source
    if (currentIndex < sources.length) {
      const nextSource = sources[currentIndex];
      console.log(`🔄 Team logo fallback: Trying ${nextSource.source} for ${team.name}`);
      
      // For national teams, skip 365scores if it's returning club logos
      if (isNationalTeam && nextSource.source === '365scores' && team?.name) {
        const teamName = team.name.toLowerCase();
        // Skip 365scores for obvious national team names
        if (teamName.includes('spain') || teamName.includes('france') || teamName.includes('england') || teamName.includes('germany')) {
          console.log(`⚠️ Skipping 365scores for national team ${team.name} - may return club logo`);
          currentIndex++;
          if (currentIndex < sources.length) {
            img.src = sources[currentIndex].url;
          } else {
            img.src = '/assets/fallback-logo.png';
          }
          return;
        }
      }
      
      img.src = nextSource.url;
    } else {
      console.warn(`❌ All team logo sources failed for ${team.name}, using final fallback`);
      img.src = '/assets/fallback-logo.png';
    }
  };
}
