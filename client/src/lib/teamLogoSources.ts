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
export function getTeamLogoSources(team: TeamData, isNationalTeam = false, sport: string = 'football'): TeamLogoSource[] {
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
    // Server proxy as primary source (most reliable)
    sources.push({
      url: `/api/team-logo/square/${team.id}?size=64&sport=${sport}`,
      source: 'server-proxy',
      priority: 1
    });

    // Server proxy circular version
    sources.push({
      url: `/api/team-logo/circular/${team.id}?size=32&sport=${sport}`,
      source: 'server-proxy-circular',
      priority: 2
    });

    // 365scores alternative (lower priority due to rate limiting)
    sources.push({
      url: `https://imagecache.365scores.com/image/upload/f_png,w_82,h_82,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v12/Competitors/${team.id}`,
      source: '365scores',
      priority: 6
    });

    // API-Sports alternative - sport-specific
    const sportEndpoint = sport === 'basketball' ? 'basketball' : 'football';
    sources.push({
      url: `https://media.api-sports.io/${sportEndpoint}/teams/${team.id}.png`,
      source: 'api-sports-alternative',
      priority: 3
    });

    // SportMonks alternative - sport-specific
    const sportPath = sport === 'basketball' ? 'basketball' : 'soccer';
    sources.push({
      url: `https://cdn.sportmonks.com/images/${sportPath}/teams/${team.id}.png`,
      source: 'sportmonks',
      priority: 4
    });

    // 365scores fallback removed due to reliability issues
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
 * Create a team logo error handler with sport-specific fallbacks
 */
export function createTeamLogoErrorHandler(team: TeamData, isNationalTeam = false, sport: string = 'football') {
  return (e: any) => {
    const target = e.target as HTMLImageElement;
    const currentSrc = target.src;

    // Get all available sources for this team and sport
    const sources = getTeamLogoSources(team, isNationalTeam, sport);

    // Find current source index
    const currentIndex = sources.findIndex(source => source.url === currentSrc);

    // Try next source
    if (currentIndex < sources.length - 1) {
      target.src = sources[currentIndex + 1].url;
    } else {
      // All sources failed, use fallback
      target.src = "/assets/fallback-logo.svg";
    }
  };
}

/**
 * Check if team is likely a national team
 */
export function isNationalTeam(
  team: { name: string },
  leagueContext?: { name?: string; country?: string }
): boolean {
  if (!team?.name) return false;

  const teamName = team.name.toLowerCase();
  const leagueName = leagueContext?.name?.toLowerCase() || '';

  // Enhanced national team detection patterns
  const nationalTeamPatterns = [
    // Direct country names
    'argentina', 'brazil', 'france', 'germany', 'spain', 'italy', 'england', 'portugal',
    'netherlands', 'belgium', 'croatia', 'mexico', 'colombia', 'uruguay', 'chile',
    'peru', 'ecuador', 'venezuela', 'bolivia', 'paraguay', 'costa rica', 'panama',
    'honduras', 'guatemala', 'el salvador', 'nicaragua', 'jamaica', 'haiti',
    'trinidad and tobago', 'barbados', 'grenada', 'dominican republic', 'cuba',
    'canada', 'usa', 'united states', 'poland', 'czech republic', 'slovakia',
    'hungary', 'romania', 'rusia', 'bulgaria', 'serbia', 'montenegro', 'bosnia', 'albania',
    'north macedonia', 'macedonia', 'fyр macedonia', 'slovenia', 'kosovo', 'moldova',
    'ukraine', 'belarus', 'lithuania', 'latvia', 'estonia', 'finland', 'sweden',
    'norway', 'denmark', 'iceland', 'ireland', 'wales', 'scotland', 'northern ireland',
    'switzerland', 'austria', 'luxembourg', 'liechtenstein', 'malta', 'cyprus',
    'georgia', 'gibraitar', 'armenia', 'azerbaijan', 'kazakhstan', 'uzbekistan', 'kyrgyzstan',
    'tajikistan', 'turkmenistan', 'afghanistan', 'pakistan', 'india', 'bangladesh',
    'sri lanka', 'maldives', 'nepal', 'bhutan', 'myanmar', 'thailand', 'laos',
    'cambodia', 'vietnam', 'malaysia', 'singapore', 'brunei', 'philippines',
    'indonesia', 'timor-leste', 'papua new guinea', 'fiji', 'vanuatu', 'samoa',
    'tonga', 'solomon islands', 'new zealand', 'australia', 'japan', 'south korea',
    'north korea', 'china', 'hong kong', 'macau', 'chinese taipei', 'mongolia',
    'iran', 'iraq', 'jordan', 'lebanon', 'syria', 'palestine', 'israel',
    'saudi arabia', 'uae', 'united arab emirates', 'qatar', 'bahrain', 'kuwait',
    'oman', 'yemen', 'turkey', 'egypt', 'libya', 'tunisia', 'algeria', 'morocco',
    'sudan', 'south sudan', 'ethiopia', 'eritrea', 'djibouti', 'somalia',
    'kenya', 'uganda', 'tanzania', 'rwanda', 'burundi', 'democratic republic of the congo',
    'republic of the congo', 'central african republic', 'chad', 'cameroon',
    'equatorial guinea', 'gabon', 'sao tome and principe', 'nigeria', 'niger',
    'mali', 'burkina faso', 'ghana', 'togo', 'benin', 'ivory coast', 'liberia',
    'sierra leone', 'guinea', 'guinea-bissau', 'senegal', 'gambia', 'mauritania',
    'cape verde', 'south africa', 'namibia', 'botswana', 'zimbabwe', 'zambia',
    'malawi', 'mozambique', 'madagascar', 'mauritius', 'seychelles', 'comoros',
    'lesotho', 'eswatini', 'swaziland', 'angola', 'faroe islands'
  ];

  // Check if the team name directly matches a country
  if (nationalTeamPatterns.some(pattern => teamName === pattern || teamName.startsWith(pattern + ' ') || teamName.endsWith(' ' + pattern))) {
    console.log(`✅ [isNationalTeam] Direct country name match: "${teamName}"`);
    return true;
  }

  // Enhanced youth team detection for U17, U19, U20, U21, U23
  const youthTeamMatch = teamName.match(/^(.+?)\s+(u|under)[-\s]?(17|19|20|21|23)$/i);
  if (youthTeamMatch) {
    const baseCountry = youthTeamMatch[1].trim();
    console.log(`🔍 [isNationalTeam] Youth team detected: "${teamName}" -> base country: "${baseCountry}"`);

    // Check if base country matches any national team pattern
    const isBaseCountryNational = nationalTeamPatterns.some(pattern => 
      baseCountry === pattern || baseCountry.includes(pattern) || pattern.includes(baseCountry)
    );

    if (isBaseCountryNational) {
      console.log(`✅ [isNationalTeam] Youth team "${teamName}" confirmed as national team`);
      return true;
    }
  }

  // Additional specific checks for problematic teams from your screenshot
  const specificNationalTeams = [
    'romania u21', 'kosovo u21', 'iceland u21', 'faroe islands u21',
    'moldova u21', 'republic of ireland u21', 'northern ireland u21'
  ];

  if (specificNationalTeams.includes(teamName)) {
    console.log(`✅ [isNationalTeam] Specific national team detected: "${teamName}"`);
    return true;
  }

  // Check for league context
  if (leagueName) {
    // Check if the league name itself implies a national team competition
    const nationalCompetitionIndicators = [
      'world cup', 'euro', 'uefa euro', 'copa america', 'gold cup',
      'africa cup of nations', 'asian cup', 'nations league', 'uefa nations league',
      'friendlies international', 'international friendlies', 'olympic',
      'uefa under-21', 'u21 championship', 'youth championship', 'under-21 championship'
    ];

    const isNationalCompetition = nationalCompetitionIndicators.some(indicator => 
      leagueName.includes(indicator)
    );

    if (isNationalCompetition) {
      console.log(`🏆 [isNationalTeam] National competition context: "${leagueName}" for team "${teamName}"`);

      // Special handling for UEFA Under-21 Championship and similar youth tournaments
      if (leagueName.includes('uefa under-21') || leagueName.includes('under-21 championship')) {
        console.log(`🇪🇺 [isNationalTeam] UEFA Under-21 Championship detected for: "${teamName}"`);
        // All teams in UEFA Under-21 are national teams by definition
        return true;
      }

      // In national competitions, assume teams are national unless clearly club teams
      const clubIndicators = ['fc', 'club', 'united', 'city', 'real ', 'ac ', 'sc '];
      const hasClubIndicators = clubIndicators.some(indicator => 
        teamName.includes(indicator)
      );

      if (!hasClubIndicators) {
        console.log(`✅ [isNationalTeam] Team in national competition without club indicators: "${teamName}"`);
        return true;
      }
    }
  }
  
  // Fallback: If none of the above, assume it's not a national team
  console.log(`❌ [isNationalTeam] No national team indicators found for: "${teamName}" in league "${leagueName}"`);
  return false;
}