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
 * Generate team logo sources with 365scores support
 */
export function getTeamLogoSources(team: TeamData, isNationalTeam = false): TeamLogoSource[] {
  const sources: TeamLogoSource[] = [];

  // For national teams or international competitions, prioritize 365scores
  if (isNationalTeam && team?.id) {
    sources.push({
      url: `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${team.id}`,
      source: '365scores',
      priority: 1
    });
  }

  // Original team logo
  if (team?.logo && typeof team.logo === 'string' && team.logo.trim() !== '') {
    sources.push({
      url: team.logo,
      source: 'api-sports-original',
      priority: isNationalTeam ? 2 : 1
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

export const isNationalTeam = (team: any, league: any): boolean => {
  if (!team || !league) return false;

  const teamName = team.name?.toLowerCase() || '';
  const leagueName = league.name?.toLowerCase() || '';
  const leagueCountry = league.country?.toLowerCase() || '';

  // Check if it's an international competition
  const isInternationalCompetition = 
    leagueName.includes('nations league') ||
    leagueName.includes('uefa nations league') ||
    leagueName.includes('international') ||
    leagueName.includes('friendlies') ||
    leagueName.includes('world cup') ||
    leagueName.includes('euro') ||
    leagueName.includes('copa america') ||
    leagueName.includes('uefa') ||
    leagueName.includes('conmebol') ||
    leagueName.includes('fifa') ||
    leagueCountry.includes('world') ||
    leagueCountry.includes('europe') ||
    leagueCountry.includes('international');

  // For international competitions, assume teams are national teams
  if (isInternationalCompetition) {
    return true;
  }

  return false;
};

/**
 * Get custom flag URL for national teams in Nations League and international competitions
 */
export const getNationalTeamFlag = (teamName: string, league: any): string | null => {
  if (!teamName || !league) return null;

  const leagueName = league.name?.toLowerCase() || '';
  const isNationsLeague = leagueName.includes('nations league') || leagueName.includes('uefa nations league');
  const isInternationalMatch = leagueName.includes('international') || leagueName.includes('friendlies');

  // Only use custom flags for Nations League and international matches
  if (!isNationsLeague && !isInternationalMatch) return null;

  // Map team names to custom flag paths
  const customFlagMapping: { [key: string]: string } = {
    // European teams
    'Germany': '/assets/flags/germany-flag.svg',
    'Portugal': '/assets/flags/portugal-flag.svg',
    'France': '/assets/flags/france-flag.svg',
    'Spain': '/assets/flags/spain-flag.svg',
    'England': '/assets/flags/england-flag.svg',
    'Italy': '/assets/flags/italy-flag.svg',
    'Netherlands': '/assets/flags/netherlands-flag.svg',
    'Belgium': '/assets/flags/belgium-flag.svg',
    'Croatia': '/assets/flags/croatia-flag.svg',
    'Poland': '/assets/flags/poland-flag.svg',
    'Turkey': '/assets/flags/turkey-flag.svg',
    'Switzerland': '/assets/flags/switzerland-flag.svg',
    'Denmark': '/assets/flags/denmark-flag.svg',
    'Austria': '/assets/flags/austria-flag.svg',
    'Scotland': '/assets/flags/scotland-flag.svg',
    'Wales': '/assets/flags/wales-flag.svg',
    'Czech Republic': '/assets/flags/czech-republic-flag.svg',
    'Czechia': '/assets/flags/czech-republic-flag.svg',
    'Ukraine': '/assets/flags/ukraine-flag.svg',
    'Norway': '/assets/flags/norway-flag.svg',
    'Sweden': '/assets/flags/sweden-flag.svg',
    
    // Additional Friendlies countries
    'Bulgaria': '/assets/flags/bulgaria-flag.svg',
    'Cyprus': '/assets/flags/cyprus-flag.svg',
    'Finland': '/assets/flags/finland-flag.svg',
    'Iceland': '/assets/flags/iceland-flag.svg',
    'Luxembourg': '/assets/flags/luxembourg-flag.svg',
    'Ireland': '/assets/flags/ireland-flag.svg',
    'Malta': '/assets/flags/malta-flag.svg',
    'Liechtenstein': '/assets/flags/liechtenstein-flag.svg',
    'Andorra': '/assets/flags/andorra-flag.svg',
    'San Marino': '/assets/flags/san-marino-flag.svg',
    
    // South American teams
    'Brazil': '/assets/flags/brazil-flag.svg',
    'Argentina': '/assets/flags/argentina-flag.svg',
    'Colombia': '/assets/flags/colombia-flag.svg',
    'Chile': '/assets/flags/chile-flag.svg',
    'Uruguay': '/assets/flags/uruguay-flag.svg',
    
    // North American teams
    'United States': '/assets/flags/usa-flag.svg',
    'USA': '/assets/flags/usa-flag.svg',
    'US': '/assets/flags/usa-flag.svg',
    'Mexico': '/assets/flags/mexico-flag.svg',
    'Canada': '/assets/flags/canada-flag.svg',
    
    // Asian/Oceanic teams
    'Japan': '/assets/flags/japan-flag.svg',
    'South Korea': '/assets/flags/south-korea-flag.svg',
    'Australia': '/assets/flags/australia-flag.svg',
  };

  // Try exact match first
  if (customFlagMapping[teamName]) {
    return customFlagMapping[teamName];
  }

  // Try partial matches for team names that might have variations
  const normalizedTeamName = teamName.toLowerCase();
  for (const [country, flagPath] of Object.entries(customFlagMapping)) {
    if (normalizedTeamName.includes(country.toLowerCase())) {
      return flagPath;
    }
  }

  return null;
};

/**
 * Create enhanced error handler for team logos
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
      img.src = nextSource.url;
    } else {
      console.warn(`❌ All team logo sources failed for ${team.name}, using final fallback`);
      img.src = '/assets/fallback-logo.png';
    }
  };
}