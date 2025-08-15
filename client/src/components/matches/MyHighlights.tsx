import React, { useState, useEffect, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, AlertCircle, Loader2 } from "lucide-react";

interface MyHighlightsProps {
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  matchStatus?: string;
  match?: any;
  matchId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  // New props to receive team data from MyMatchdetailsScoreboard
  homeTeamData?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  awayTeamData?: {
    id?: number;
    name?: string;
    logo?: string;
  };
}

interface VideoSource {
  name: string;
  type: 'youtube' | 'vimeo' | 'dailymotion' | 'feed';
  url?: string;
  embedUrl?: string;
  title?: string;
  error?: string;
}

const MyHighlights: React.FC<MyHighlightsProps> = ({ 
  homeTeam, 
  awayTeam, 
  leagueName, 
  match,
  homeTeamName,
  awayTeamName,
  matchStatus,
  homeTeamData,
  awayTeamData
}) => {
  // Check match status to determine if we should render
  const status = matchStatus || match?.fixture?.status?.short;

  // Only show highlights for ended matches or live matches with a status that indicates play is ongoing
  const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(status);
  const isLiveOrOngoing = ["1H", "2H", "HT", "ET", "P", "BT", "90M", "91M", "92M", "93M", "94M", "95M", "96M", "97M", "98M", "99M", "100M", "101M", "102M", "103M", "104M", "105M", "106M", "107M", "108M", "109M", "110M", "111M", "112M", "113M", "114M", "115M", "116M", "117M", "118M", "119M", "120M"].includes(status);
  const shouldShowHighlights = isEnded || isLiveOrOngoing;


  // Extract original English team names for search queries (not translated names)
  // Use the original API data to ensure we get the English names for better search results
  const rawHome = match?.teams?.home?.name || 
                  match?.homeTeam?.name ||
                  match?.homeTeam ||
                  match?.home?.name ||
                  match?.home ||
                  homeTeam || 
                  homeTeamName || 
                  homeTeamData?.name ||
                  'Home Team';

  const rawAway = match?.teams?.away?.name || 
                  match?.awayTeam?.name ||
                  match?.awayTeam ||
                  match?.away?.name ||
                  match?.away ||
                  awayTeam || 
                  awayTeamName || 
                  awayTeamData?.name ||
                  'Away Team';

  // More lenient validation - allow fallback team names for debugging
  const hasValidTeamNames = rawHome && rawAway && 
                           rawHome.trim() !== '' && rawAway.trim() !== '' &&
                           rawHome !== 'undefined' && rawAway !== 'undefined';

  console.log(`🎬 [Highlights] Team name extraction:`, {
    rawHome,
    rawAway,
    hasValidTeamNames,
    homeTeamData: homeTeamData?.name,
    awayTeamData: awayTeamData?.name,
    matchTeams: {
      home: match?.teams?.home?.name,
      away: match?.teams?.away?.name
    },
    fallbackUsed: rawHome === 'Home Team' || rawAway === 'Away Team',
    status
  });

  // Don't return null - always show the component for debugging, even with invalid team names


  // Show highlights for more match types - but don't return null, show debug info
  if (!shouldShowHighlights) {
    console.log(`🎬 [Highlights] Match status not suitable for highlights:`, {
      status,
      teams: `${rawHome} vs ${rawAway}`,
      shouldShowHighlights
    });
  }
  const uniqueId = useId();
  const [currentSource, setCurrentSource] = useState<VideoSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [iframeError, setIframeError] = useState(false); // Added state for iframe error

  // Helper function to clean team names for better search results
  const cleanTeamName = (name: string): string => {
    if (!name || name === 'Home Team' || name === 'Away Team') return name;

    // Define teams that should keep their exact names to avoid confusion
    const keepExactNames = [
      'atletico', 'atlético', 'palmeiras', 'botafogo', 'flamengo', 'corinthians',
      'são paulo', 'santos', 'cruzeiro', 'grêmio', 'internacional', 'vasco',
      'sport', 'bahia', 'ceará', 'fortaleza', 'athletico', 'coritiba',
      'arsenal', 'chelsea', 'manchester', 'liverpool', 'tottenham',
      'real madrid', 'barcelona', 'atletico madrid', 'valencia',
      'juventus', 'milan', 'inter', 'napoli', 'roma', 'lazio',
      'bayern', 'dortmund', 'leipzig', 'frankfurt'
    ];

    const nameLower = name.toLowerCase();

    // Check if this team should keep its exact name
    if (keepExactNames.some(exact => nameLower.includes(exact))) {
      return name.trim(); // Keep exact name for teams prone to confusion
    }

    // For other teams, do minimal cleaning while preserving important identifiers
    return name
      .replace(/\s+(Academy|Youth|U\d+|Under\d+|Reserves|II|III|IV|V|VI|VII|VIII|IX|X|B)$/i, '')
      .replace(/\s+(FC|CF|SC|AC|AS|SSC|SL|CD|CA|CP|EC|RC)$/i, '') // Remove common suffixes but keep for disambiguation if needed
      .replace(/\s+(United|City|Town|Athletic|Sporting|Nacional|Internacional)$/i, '$1') // Keep important identifiers
      .trim();
  };

  // Extract team names prioritizing data from MyMatchdetailsScoreboard
  // This ensures we use the same team names that are displayed in the scoreboard


  // Clean team names for better search results
  const home = cleanTeamName(rawHome);
  const away = cleanTeamName(rawAway);

  const league = leagueName || 
                 match?.league?.name || 
                 match?.leagueName ||
                 match?.competition?.name ||
                 '';

  // Extract year from match date with better validation
  const matchYear = (() => {
    const dateStr = match?.fixture?.date || match?.date || match?.matchDate;
    if (dateStr) {
      const year = new Date(dateStr).getFullYear();
      // Validate year is reasonable (between 2000 and current year + 1)
      const currentYear = new Date().getFullYear();
      if (year >= 2000 && year <= currentYear + 1) {
        return year;
      }
    }
    return new Date().getFullYear();
  })();

  // Check if this is a CONCACAF competition
  const isConcacafCompetition = league.toLowerCase().includes('concacaf') || 
                               league.toLowerCase().includes('gold cup') ||
                               league.toLowerCase().includes('concacaf');

  // Check if this is a FIFA Club World Cup competition
  const isFifaClubWorldCup = league.toLowerCase().includes('fifa') && 
                            league.toLowerCase().includes('club world cup');

  // Check if this is a Brazilian league competition
  const isBrazilianLeague = league.toLowerCase().includes('brazil') ||
                           league.toLowerCase().includes('brasileiro') ||
                           league.toLowerCase().includes('serie a') ||
                           league.toLowerCase().includes('serie b') ||
                           league.toLowerCase().includes('copa do brasil') ||
                           league.toLowerCase().includes('paulista') ||
                           league.toLowerCase().includes('carioca') ||
                           league.toLowerCase().includes('mineiro') ||
                           league.toLowerCase().includes('gaucho') ||
                           league.toLowerCase().includes('brazil');

  // Helper function to create team-specific exclusions
  const createTeamExclusions = (homeTeam: string, awayTeam: string) => {
    const exclusions = ['-esoccer', '-virtual', '-gaming', '-fifa', '-pes', '-mobile', '-simulation'];

    // Add specific exclusions based on team names to avoid confusion
    const homeTeamLower = homeTeam.toLowerCase();
    const awayTeamLower = awayTeam.toLowerCase();

    // Brazilian team exclusions to avoid confusion between similar names
    if (homeTeamLower.includes('atletico') && !homeTeamLower.includes('pr')) {
      exclusions.push('-"athletico-pr"', '-"atletico-pr"');
    }
    if (awayTeamLower.includes('atletico') && !awayTeamLower.includes('pr')) {
      exclusions.push('-"athletico-pr"', '-"atletico-pr"');
    }

    // Avoid Botafogo confusion (main Botafogo vs Botafogo-SP)
    if ((homeTeamLower.includes('botafogo') || awayTeamLower.includes('botafogo')) && 
        !homeTeamLower.includes('sp') && !awayTeamLower.includes('sp')) {
      exclusions.push('-"botafogo-sp"', '-"botafogo sp"');
    }

    // Avoid confusion with major European teams when searching for other teams
    if (!homeTeamLower.includes('psg') && !awayTeamLower.includes('psg')) {
      exclusions.push('-"paris saint germain"', '-psg');
    }

    return exclusions.join(' ');
  };

  const teamExclusions = createTeamExclusions(rawHome, rawAway);

  // Create multiple search strategies with different approaches
  const primarySearchQuery = `"${rawHome}" vs "${rawAway}" highlights ${matchYear} ${teamExclusions}`.trim();

  // Alternative search with cleaned names
  const secondarySearchQuery = `"${home}" vs "${away}" highlights ${matchYear} ${teamExclusions}`.trim();

  // Search with league context for better accuracy
  const leagueSpecificQuery = league ? 
    `"${rawHome}" vs "${rawAway}" "${league}" ${matchYear} highlights ${teamExclusions}`.trim() :
    primarySearchQuery;

  // Broader search without quotes for difficult matches
  const broadSearchQuery = `${rawHome} ${away} highlights ${matchYear} ${teamExclusions}`.trim();

  // Year-flexible search for older matches
  const flexibleYearQuery = `"${rawHome}" vs "${rawAway}" highlights ${teamExclusions}`.trim();

  // Additional exclusions for Brazilian league confusion
  const brazilianSafeQuery = isBrazilianLeague ? 
    `"${rawHome}" vs "${rawAway}" brasileiro ${matchYear} melhores momentos ${teamExclusions}`.trim() :
    primarySearchQuery;

  const fallbackSearchQuery = `${home} vs ${away} highlights -virtual -gaming -esoccer -app -botafogo -psg`.trim();

  const exactTeamMatchQuery = `"${rawHome}" vs "${rawAway}"`;
  const tertiarySearchQuery = `${rawHome} vs ${rawAway} ${league} ${matchYear} highlights ${teamExclusions}`;


  // Special case for Palmeiras vs Chelsea - use known video (only for exact match)
  const isPalmeirasChelsea = ((home.toLowerCase() === 'palmeiras' || home.toLowerCase().includes('palmeiras')) && 
                             (away.toLowerCase() === 'chelsea' || away.toLowerCase().includes('chelsea'))) ||
                            ((home.toLowerCase() === 'chelsea' || home.toLowerCase().includes('chelsea')) && 
                             (away.toLowerCase() === 'palmeiras' || away.toLowerCase().includes('palmeiras')));

  // Special case for USA vs Mexico 2025 Gold Cup - use known video
  const isUsaMexico2025 = (home.toLowerCase().includes('usa') && away.toLowerCase().includes('mexico')) ||
                         (home.toLowerCase().includes('mexico') && away.toLowerCase().includes('usa'));

  // Special case for PSG vs Real Madrid 2025 FIFA Club World Cup - use correct video
  const isPsgRealMadrid2025 = (home.toLowerCase().includes('paris saint germain') && away.toLowerCase().includes('real madrid')) ||
                             (home.toLowerCase().includes('real madrid') && away.toLowerCase().includes('paris saint germain'));

  // Special case for CRB vs Coritiba match - use reliable video source
  const isCRBCoritiba = (home.toLowerCase().includes('crb') && away.toLowerCase().includes('coritiba')) ||
                       (home.toLowerCase().includes('coritiba') && away.toLowerCase().includes('crb'));

  // Debug logging to verify correct team names and order
  console.log(`🎬 [Highlights] Match data extraction with validation:`, {
    validation: {
      hasValidTeamNames,
      rawHomeValid: rawHome !== 'Home Team' && rawHome?.trim(),
      rawAwayValid: rawAway !== 'Away Team' && rawAway?.trim(),
    },
    prioritizedFromScoreboard: {
      homeTeamData: homeTeamData?.name,
      awayTeamData: awayTeamData?.name,
    },
    extractedFromMatch: {
      homeFromTeams: match?.teams?.home?.name,
      awayFromTeams: match?.teams?.away?.name,
    },
    finalResult: {
      rawHomeTeam: rawHome,
      rawAwayTeam: rawAway,
      cleanedHomeTeam: home,
      cleanedAwayTeam: away,
    },
    searchQueries: {
      primarySearchQuery,
      leagueSpecificQuery,
      brazilianSafeQuery,
    },
    specialCases: {
      // These will be declared after this debug section
    },
    expectedOrder: `${home} vs ${away}`,
    league: league,
    matchYear: matchYear,
    isBrazilianLeague
  });

  // Helper function to validate video title order matches home vs away
  const validateTitleOrder = (title: string, homeTeam: string, awayTeam: string): boolean => {
    const titleLower = title.toLowerCase();
    const homeLower = homeTeam.toLowerCase();
    const awayLower = awayTeam.toLowerCase();

    // Find positions of team names in title
    const homePos = titleLower.indexOf(homeLower);
    const awayPos = titleLower.indexOf(awayLower);

    const homeWords = homeLower.split(' ').filter(word => word.length > 2);
    const awayWords = awayLower.split(' ').filter(word => titleLower.includes(word));

    const homeWordMatches = homeWords.filter(word => titleLower.includes(word));
    const awayWordMatches = awayWords.filter(word => titleLower.includes(word));

    console.log(`🎬 [validateTitleOrder] Validation results:`, {
      title: titleLower,
      homeTeam: homeLower,
      awayTeam: awayLower,
      homeWordMatches: homeWordMatches.length,
      awayWordMatches: awayWordMatches.length,
      homePos,
      awayPos
    });

    // Strong validation: if both teams have good matches and home is mentioned first
    if (homeWordMatches.length >= 1 && awayWordMatches.length >= 1) {
      if (homePos >= 0 && awayPos >= 0) {
        return homePos < awayPos; // Home should come first for correct order
      }
      return homeWordMatches.length >= awayWordMatches.length; // Prefer team with more word matches
    }

    // Fallback validation
    if (homeWordMatches.length > 0 || awayWordMatches.length > 0) {
      return homeWordMatches.length >= awayWordMatches.length;
    }

    // If only one team found or neither found, return true (don't filter out)
    return true;
  };

  // Helper function to calculate relevance score for video titles
  const calculateRelevanceScore = (title: string, homeTeam: string, awayTeam: string): number => {
    const titleLower = title.toLowerCase();
    const homeLower = homeTeam.toLowerCase();
    const awayLower = awayTeam.toLowerCase();

    let score = 0;

    // Check for esports/virtual match terms - heavily penalize these
    const esportsTerms = [
      'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual', 'fifa 24', 'fifa 25',
      'pro evolution soccer', 'pes', 'efootball', 'e-football', 'volta',
      'ultimate team', 'clubs', 'gaming', 'game', 'simulator', 'simulation',
      'digital', 'online battle', 'legend', 'champion online', 'tournament online',
      'vs online', 'gt sport', 'rocket league', 'fc online', 'dream league',
      'top eleven', 'football manager', 'championship manager', 'mobile', 'app',
      'eafc', 'ea fc', 'ea sports fc', 'console', 'playstation', 'xbox',
      'pc gaming', 'stream', 'twitch', 'youtube gaming', 'android', 'ios'
    ];

    // Heavy penalty for esports content
    if (esportsTerms.some(term => titleLower.includes(term))) {
      score -= 200; // Very heavy penalty to ensure esports content is filtered out
    }

    // Check for exact team name matches first (highest priority)
    const exactHomeMatch = titleLower.includes(homeLower);
    const exactAwayMatch = titleLower.includes(awayLower);

    if (exactHomeMatch && exactAwayMatch) {
      score += 100; // Very high bonus for both teams found exactly

      // Additional bonus for correct order
      const homePos = titleLower.indexOf(homeLower);
      const awayPos = titleLower.indexOf(awayLower);
      if (homePos < awayPos) {
        score += 15; // Bonus for correct order
      }

      // Bonus for "vs" or similar separators between teams
      const teamSection = titleLower.substring(homePos, awayPos + awayLower.length);
      const vsKeywords = ['vs', 'v ', 'versus', ' - ', ' against '];
      if (vsKeywords.some(keyword => teamSection.includes(keyword))) {
        score += 10;
      }
    } else if (exactHomeMatch || exactAwayMatch) {
      score += 50; // Good bonus for one exact match
    }

    // Check for partial team name matches
    const homeWords = homeLower.split(' ').filter(word => word.length > 2);
    const awayWords = awayLower.split(' ').filter(word => titleLower.includes(word));

    const homeMatches = homeWords.filter(word => titleLower.includes(word));
    const awayMatches = awayWords.filter(word => titleLower.includes(word));

    // Bonus for partial matches
    score += homeMatches.length * 5;
    score += awayMatches.length * 5;

    // Require at least partial matches for both teams
    if (homeMatches.length === 0 || awayMatches.length === 0) {
      score -= 50; // Penalty if one team is completely missing
    }

    // Special validation for Brazilian teams with similar names (like Atletico-MG vs Atletico-PR)
    if (homeLower.includes('atletico') || awayLower.includes('atletico')) {
      // Check for wrong Atletico team (e.g., searching for Atletico-MG but finding Atletico-PR)
      const wrongAtleticoTerms = ['athletico-pr', 'atletico-pr', 'atletico paranaense'];
      if (homeLower.includes('atletico-mg') || homeLower.includes('atlético-mg')) {
        // If we're looking for Atletico-MG, heavily penalize Atletico-PR videos
        if (wrongAtleticoTerms.some(term => titleLower.includes(term))) {
          score -= 200; // Very heavy penalty for wrong Atletico team
        }
      }
      if (awayLower.includes('atletico-mg') || awayLower.includes('atlético-mg')) {
        // If we're looking for Atletico-MG, heavily penalize Atletico-PR videos
        if (wrongAtleticoTerms.some(term => titleLower.includes(term))) {
          score -= 200; // Very heavy penalty for wrong Atletico team
        }
      }
    }

    // Bonus for real football indicators
    const realFootballTerms = [
      'official', 'stadium', 'live', 'match day', 'full time', 'half time',
      'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga',
      'ligue 1', 'uefa', 'fifa official', 'real madrid', 'barcelona', 'manchester',
      'liverpool', 'arsenal', 'chelsea', 'psg', 'bayern', 'juventus', 'milan',
      'dortmund', 'atletico', 'tottenham', 'inter', 'napoli', 'roma', 'sevilla',
      'melhores momentos', 'gols', 'resumo', 'highlights', 'goals', 'sudamericana',
      'libertadores', 'copa do brasil', 'brasileirao', 'serie a brazil'
    ];

    // Bonus for real football content
    if (realFootballTerms.some(term => titleLower.includes(term))) {
      score += 20;
    }

    const homePos = titleLower.indexOf(homeLower);
    const awayPos = titleLower.indexOf(awayLower);

    // The exactHomeMatch and exactAwayMatch variables are already declared above
    // Use the existing variables for the bonus calculation
    if (exactHomeMatch && exactAwayMatch) {
      score += 50; // Big bonus for exact matches of both team names
    }

    if (homePos !== -1 && awayPos !== -1) {
      // Both teams found exactly
      score += 20;

      // Bonus for correct order (home before away)
      if (homePos < awayPos) {
        score += 10;
      } else {
        // Smaller penalty for wrong order since some channels use different conventions
        score -= 2;
      }

      // Check for "vs" between teams
      const vsKeywords = ['vs', 'v ', 'versus', '-', 'against', 'x ', ' x '];
      const teamSection = titleLower.substring(homePos, awayPos + awayLower.length);
      if (vsKeywords.some(keyword => teamSection.includes(keyword))) {
        score += 5;
      }

      // Bonus for highlights-related keywords
      const highlightKeywords = ['highlights', 'goals', 'best moments', 'summary', 'extended', 'melhores momentos', 'gols', 'resumo'];
      if (highlightKeywords.some(keyword => titleLower.includes(keyword))) {
        score += 5;
      }

      // Bonus for exact match format "Team1 vs Team2"
      const exactPattern = new RegExp(`${homeLower}\\s*(vs?|v|x|-)\\s*${awayLower}`, 'i');
      if (exactPattern.test(titleLower)) {
        score += 8;
      }
    } else if (homeMatches.length > 0 && awayMatches.length > 0) {
      // Partial team name matches
      score += 10 + (homeMatches.length * 2) + (awayMatches.length * 2);
    } else if (homePos !== -1 || awayPos !== -1) {
      // Only one team found exactly
      score += 5;
    } else if (homeMatches.length > 0 || awayMatches.length > 0) {
      // Only partial matches for one team
      score += 2;
    }

    // Penalty for very old videos (more than 2 years difference)
    const currentYear = new Date().getFullYear();
    const yearPattern = /\b(20\d{2})\b/g;
    const videoYears = title.match(yearPattern);
    if (videoYears) {
      const videoYear = parseInt(videoYears[videoYears.length - 1]);
      const yearDifference = Math.abs(currentYear - videoYear);
      if (yearDifference > 2) {
        score -= yearDifference * 2;
      }
    }

    return score;
  };

  // Helper function to filter and sort videos by relevance and title order
  const filterAndSortVideos = (videos: any[], homeTeam: string, awayTeam: string) => {
    return videos
      .map(video => {
        const title = video.snippet?.title || '';
        const relevanceScore = calculateRelevanceScore(title, homeTeam, awayTeam);
        const correctOrder = validateTitleOrder(title, homeTeam, awayTeam);

        return {
          ...video,
          relevanceScore,
          correctOrder,
          // Combined score prioritizing relevance and correct order
          combinedScore: relevanceScore + (correctOrder ? 2 : 0)
        };
      })
      .filter(video => {
        // Filter out esports content completely
        const title = video.snippet?.title?.toLowerCase() || '';
        const esportsTerms = [
          'esoccer', 'ebet', 'cyber', 'esports', 'e-sports', 'virtual', 'fifa',
          'pro evolution soccer', 'pes', 'efootball', 'e-football', 'volta',
          'ultimate team', 'clubs', 'gaming', 'game', 'simulator', 'simulation',
          'digital', 'online', 'battle', 'legend', 'champion', 'tournament online',
          'vs online', 'gt sport', 'rocket league', 'fc online', 'dream league',
          'top eleven', 'football manager', 'championship manager', 'mobile', 'app',
          'eafc', 'ea fc', 'ea sports fc', 'console', 'playstation', 'xbox',
          'pc gaming', 'stream', 'twitch', 'youtube gaming'
        ];

        // Exclude if contains esports terms
        if (esportsTerms.some(term => title.includes(term))) {
          console.log(`🚫 [Highlights] Filtering out esports content: ${title}`);
          return false;
        }

        // Only keep videos with positive relevance score (adjusted for esports penalty)
        return video.relevanceScore > 0;
      })
      .sort((a, b) => {
        // First sort by combined score (relevance + order bonus)
        if (b.combinedScore !== a.combinedScore) {
          return b.combinedScore - a.combinedScore;
        }
        // Then by relevance score
        return b.relevanceScore - a.relevanceScore;
      });
  };

  const videoSources = [
    // Specific CRB vs Coritiba video (highest priority)
    ...(isCRBCoritiba ? [{
      name: 'CRB vs Coritiba - Official Highlights',
      type: 'youtube' as const,
      searchFn: async () => {
        return {
          name: 'CRB vs Coritiba - Official Highlights',
          type: 'youtube' as const,
          url: 'https://youtu.be/b9NkFqfVibs',
          embedUrl: 'https://www.youtube.com/embed/b9NkFqfVibs?autoplay=0&rel=0',
          title: 'CRB vs Coritiba - Match Highlights'
        };
      }
    }] : []),
    // Specific PSG vs Real Madrid 2025 FIFA Club World Cup video (highest priority)
    ...(isPsgRealMadrid2025 ? [{
      name: 'FIFA Official - PSG vs Real Madrid 2025',
      type: 'youtube' as const,
      searchFn: async () => {
        return {
          name: 'FIFA Official - PSG vs Real Madrid 2025',
          type: 'youtube' as const,
          url: 'https://www.youtube.com/watch?v=oB5FZiIxN_M',
          embedUrl: 'https://www.youtube.com/embed/oB5FZiIxN_M?autoplay=0&rel=0',
          title: 'Paris Saint-Germain vs Real Madrid - FIFA Club World Cup 2025 Highlights'
        };
      }
    }] : []),
    // Specific USA vs Mexico 2025 Gold Cup video (priority if match detected)
    ...(isUsaMexico2025 ? [{
      name: 'CONCACAF Official - USA vs Mexico 2025',
      type: 'youtube' as const,
      searchFn: async () => {
        return {
          name: 'CONCACAF Official - USA vs Mexico 2025',
          type: 'youtube' as const,
          url: 'https://www.youtube.com/watch?v=ZJ4r8dksWpY',
          embedUrl: 'https://www.youtube.com/embed/ZJ4r8dksWpY?autoplay=0&rel=0',
          title: 'USA vs Mexico - CONCACAF Gold Cup 2025 Highlights'
        };
      }
    }] : []),
    // Specific Palmeiras vs Chelsea video (priority if match detected)
    ...(isPalmeirasChelsea ? [{
      name: 'FIFA Official - Palmeiras vs Chelsea',
      type: 'youtube' as const,
      searchFn: async () => {
        return {
          name: 'FIFA Official - Palmeiras vs Chelsea',
          type: 'youtube' as const,
          url: 'https://www.youtube.com/watch?v=FCzzdOEGjlg',
          embedUrl: 'https://www.youtube.com/embed/FCzzdOEGjlg?autoplay=0&rel=0',
          title: 'Palmeiras vs Chelsea - FIFA Club World Cup Highlights'
        };
      }
    }] : []),
    // CONCACAF Official Channel (priority for CONCACAF competitions)
    ...(isConcacafCompetition ? [{
      name: 'CONCACAF Official',
      type: 'youtube' as const,
      searchFn: async () => {
        const concacafChannelId = 'UCqn7r-so0mBLaJTtTms9dAQ';
        // Try multiple search queries for better match accuracy, prioritizing specificity
        const queries = [exactTeamMatchQuery, leagueSpecificQuery, brazilianSafeQuery, primarySearchQuery, secondarySearchQuery];

        let data;

        for (const query of queries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=5&channelId=${concacafChannelId}&order=relevance`);
            data = await response.json();

            // Handle quota exceeded errors specifically
            if (data.quotaExceeded || (data.error && data.error.includes('quota'))) {
              console.warn(`🚫 [Highlights] YouTube quota exceeded, skipping to alternative sources`);
              throw new Error('YouTube quota exceeded - switching to alternative sources');
            }

            if (data.error) {
              console.warn(`❌ [Highlights] Query ${query} failed:`, data.error);
              throw new Error(data.error);
            }

            if (data.items && data.items.length > 0) {
              // Filter and sort by title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);
              data.items = sortedVideos;
              break;
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] CONCACAF search failed for query: ${query}`, error);
            continue;
          }
        }

        if (data.error || data.quotaExceeded) {
          throw new Error(data.error || 'CONCACAF channel search failed');
        }

        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          return {
            name: 'CONCACAF Official',
            type: 'youtube' as const,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
            title: video.snippet.title
          };
        }
        throw new Error('No CONCACAF official videos found');
      }
    }] : []),
    // Brazilian Futebol Official Channel (priority for Brazilian league matches)
    ...(isBrazilianLeague ? [{
      name: 'Canal do Futebol BR',
      type: 'youtube' as const,
      searchFn: async () => {
        const brazilianChannelId = 'UCsHUdM7CCtjdLsM0Vw4wQIQ';

        // Enhanced team exclusion function
        const getTeamExclusions = (teamName: string): string => {
          const exclusions: { [key: string]: string[] } = {
            'São Paulo': ['-"São Paulo FC"', '-"SPFC"', '-"Tricolor"'],
            'Santos': ['-"Santos FC"', '-"Peixe"'],
            'Palmeiras': ['-"Palmeiras"', '-"Verdão"'],
            'Corinthians': ['-"Corinthians"', '-"Timão"'],
            'Flamengo': ['-"Flamengo"', '-"Mengão"'],
            'Vasco': ['-"Vasco da Gama"', '-"Gigante da Colina"'],
            'Botafogo': ['-"Botafogo"', '-"Glorioso"'],
            'Fluminense': ['-"Fluminense"', '-"Tricolor das Laranjeiras"']
          };
          return exclusions[teamName]?.join(' ') || '';
        };

        const homeExclusions = getTeamExclusions(rawHome);
        const awayExclusions = getTeamExclusions(rawAway);
        const combinedExclusions = `${homeExclusions} ${awayExclusions}`;

        // Create Brazil-specific search queries with strict team matching
        const brazilQueries = [
          `"${rawHome}" vs "${rawAway}" highlights ${matchYear} ${combinedExclusions}`,
          `"${rawHome}" x "${rawAway}" melhores momentos ${matchYear} ${combinedExclusions}`,
          `"${rawHome}" vs "${rawAway}" brasileiro ${matchYear} ${combinedExclusions}`,
          exactTeamMatchQuery + ` ${combinedExclusions}`
        ];

        let data;

        for (const query of brazilQueries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=5&channelId=${brazilianChannelId}&order=relevance`);
            data = await response.json();

            // Handle quota exceeded errors specifically
            if (data.quotaExceeded || (data.error && data.error.includes('quota'))) {
              console.warn(`🚫 [Highlights] YouTube quota exceeded, skipping to alternative sources`);
              throw new Error('YouTube quota exceeded - switching to alternative sources');
            }

            if (data.error) {
              console.warn(`❌ [Highlights] Query ${query} failed:`, data.error);
              throw new Error(data.error);
            }

            if (data.items && data.items.length > 0) {
              // Filter and sort by title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);
              data.items = sortedVideos;
              break;
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] Brazilian channel search failed for query: ${query}`, error);
            continue;
          }
        }

        if (data.error || data.quotaExceeded) {
          throw new Error(data.error || 'Brazilian channel search failed');
        }

        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          return {
            name: 'Canal do Futebol BR',
            type: 'youtube' as const,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
            title: video.snippet.title
          };
        }
        throw new Error('No Canal do Futebol BR videos found');
      }
    }] : []),
    // FIFA Club World Cup Official Channel (priority)
    ...(isFifaClubWorldCup && !isPalmeirasChelsea ? [{
      name: 'FIFA Official',
      type: 'youtube' as const,
      searchFn: async () => {
        const fifaChannelId = 'UCK-mxP4hLap1t3dp4bPbSBg';
        // For Palmeiras vs Chelsea, use Chelsea-focused search to avoid Benfica results
        const searchTerm = isPalmeirasChelsea ? 'Chelsea highlights FIFA Club World Cup' : primarySearchQuery;
        const queries = isPalmeirasChelsea ? [searchTerm] : [primarySearchQuery, secondarySearchQuery, tertiarySearchQuery];
        let data;

        for (const query of queries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=5&channelId=${fifaChannelId}&order=relevance`);
            data = await response.json();

            // Handle quota exceeded errors specifically
            if (data.quotaExceeded || (data.error && data.error.includes('quota'))) {
              console.warn(`🚫 [Highlights] YouTube quota exceeded, skipping to alternative sources`);
              throw new Error('YouTube quota exceeded - switching to alternative sources');
            }

            if (data.error) {
              console.warn(`❌ [Highlights] Query ${query} failed:`, data.error);
              throw new Error(data.error);
            }

            if (data.items && data.items.length > 0) {
              // Filter and sort by title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);
              data.items = sortedVideos;
              break;
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] FIFA search failed for query: ${query}`, error);
            continue;
          }
        }

        if (data.error || data.quotaExceeded) {
          throw new Error(data.error || 'FIFA channel search failed');
        }

        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          return {
            name: 'FIFA Official',
            type: 'youtube' as const,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
            title: video.snippet.title
          };
        }
        throw new Error('No FIFA official videos found');
      }
    }] : []),
    {
      name: 'YouTube Official Highlights',
      type: 'youtube' as const,
      searchFn: async () => {
        // More lenient exclusion terms - only exclude the most obvious non-highlight content
        const basicExclusions = `-"React" -"reaction" -"fifa 24" -"fifa 25" -"pes" -"gaming" -"gameplay"`;

        // Broader search queries with less strict filtering
        const queries = [
          `"${rawHome}" vs "${rawAway}" highlights ${matchYear}`,
          `"${rawHome}" "${rawAway}" highlights ${matchYear}`,
          `${home} vs ${away} highlights ${matchYear}`,
          `"${rawHome}" vs "${rawAway}" goals ${matchYear}`,
          `${rawHome} ${rawAway} highlights ${basicExclusions}`,
          `"${home}" "${away}" highlights`,
          `${rawHome} ${rawAway} goals`,
          // More flexible searches without year restriction
          `"${rawHome}" vs "${rawAway}" highlights`,
          `${home} vs ${away} highlights`
        ];

        // Add league-specific queries at the beginning if league is available
        if (league) {
          const leagueTerms = league.toLowerCase();
          if (leagueTerms.includes('champions league') || leagueTerms.includes('libertadores')) {
            queries.unshift(`"${rawHome}" vs "${rawAway}" "${league}" highlights ${matchYear}`);
          } else if (leagueTerms.includes('brasileirão') || leagueTerms.includes('serie a')) {
            queries.unshift(`"${rawHome}" vs "${rawAway}" brasileirão highlights ${matchYear}`);
            queries.unshift(`"${rawHome}" x "${rawAway}" brasileirão ${matchYear}`);
          }
        }

        for (let i = 0; i < Math.min(queries.length, 6); i++) { // Limit to 6 queries to avoid rate limits
          const query = queries[i];
          try {
            console.log(`🔍 [Highlights] Trying query ${i + 1}/6 for ${rawHome} vs ${rawAway}: "${query}"`);

            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=15&order=relevance`);
            const data = await response.json();

            // Handle quota exceeded errors
            if (data.quotaExceeded || (data.error && data.error.includes('quota'))) {
              console.warn(`🚫 [Highlights] YouTube quota exceeded, trying fallback approach`);
              // Try a simpler search with just team names
              const fallbackQuery = `${rawHome} ${rawAway}`;
              const fallbackResponse = await fetch(`/api/youtube/search?q=${encodeURIComponent(fallbackQuery)}&maxResults=10&order=relevance`);
              const fallbackData = await fallbackResponse.json();
              
              if (fallbackData.items && fallbackData.items.length > 0) {
                console.log(`✅ [Highlights] Using fallback search results`);
                const video = fallbackData.items[0];
                return {
                  name: 'YouTube Highlights (Fallback)',
                  type: 'youtube' as const,
                  url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
                  title: video.snippet.title
                };
              }
              throw new Error('YouTube quota exceeded - no fallback results');
            }

            if (data.error) {
              console.warn(`❌ [Highlights] Query ${i + 1} error:`, data.error);
              continue; // Try next query
            }

            if (data.items && data.items.length > 0) {
              // More lenient filtering - only exclude obvious non-highlight content
              const filteredVideos = data.items.filter((video: any) => {
                const title = video.snippet.title.toLowerCase();
                const channelTitle = video.snippet.channelTitle.toLowerCase();

                // Only exclude obvious gaming/reaction content
                const strictExclusions = [
                  'fifa 24', 'fifa 25', 'pes 202', 'efootball', 'gaming', 'gameplay',
                  'react to', 'reaction to', 'first time watching', 'assistindo pela primeira vez'
                ];

                if (strictExclusions.some(term => title.includes(term) || channelTitle.includes(term))) {
                  return false;
                }

                // Check if at least one team name is present
                const homeInTitle = title.includes(home.toLowerCase()) || title.includes(rawHome.toLowerCase());
                const awayInTitle = title.includes(away.toLowerCase()) || title.includes(rawAway.toLowerCase());

                return homeInTitle || awayInTitle; // More lenient - allow if at least one team is mentioned
              });

              if (filteredVideos.length > 0) {
                // Simple sorting by view count and relevance
                const sortedVideos = filteredVideos.sort((a: any, b: any) => {
                  const aTitle = a.snippet.title.toLowerCase();
                  const bTitle = b.snippet.title.toLowerCase();

                  // Prioritize videos with both team names
                  const aHasBothTeams = (aTitle.includes(home.toLowerCase()) || aTitle.includes(rawHome.toLowerCase())) &&
                                       (aTitle.includes(away.toLowerCase()) || aTitle.includes(rawAway.toLowerCase()));
                  const bHasBothTeams = (bTitle.includes(home.toLowerCase()) || bTitle.includes(rawHome.toLowerCase())) &&
                                       (bTitle.includes(away.toLowerCase()) || bTitle.includes(rawAway.toLowerCase()));

                  if (aHasBothTeams && !bHasBothTeams) return -1;
                  if (!aHasBothTeams && bHasBothTeams) return 1;

                  // Prioritize videos with highlight keywords
                  const highlightTerms = ['highlights', 'goals', 'melhores momentos', 'resumo', 'gols'];
                  const aHasHighlights = highlightTerms.some(term => aTitle.includes(term));
                  const bHasHighlights = highlightTerms.some(term => bTitle.includes(term));

                  if (aHasHighlights && !bHasHighlights) return -1;
                  if (!aHasHighlights && bHasHighlights) return 1;

                  return 0;
                });

                const video = sortedVideos[0];
                console.log(`✅ [Highlights] Selected video from query ${i + 1}:`, {
                  title: video.snippet.title,
                  channel: video.snippet.channelTitle,
                  filteredCount: filteredVideos.length,
                  totalCount: data.items.length
                });
                return {
                  name: 'YouTube Official Highlights',
                  type: 'youtube' as const,
                  url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
                  title: video.snippet.title
                };
              } else {
                console.log(`⚠️ [Highlights] Query ${i + 1} had ${data.items.length} results but none passed filtering`);
              }
            } else {
              console.log(`📭 [Highlights] Query ${i + 1} returned no results`);
            }
          } catch (error) {
            console.warn(`❌ [Highlights] Query ${i + 1} failed for: ${query}`, error);
            continue;
          }
        }
        throw new Error('No YouTube highlights found after trying all queries');
      }
    },
    // Add a generic fallback source that always provides something
    {
      name: 'ScoreBat Highlights',
    type: 'feed' as const,
    searchFn: async () => {
      console.log(`🔍 [Highlights] Using ScoreBat fallback for ${rawHome} vs ${rawAway}`);
      
      // Create a generic embed URL based on team names
      const searchTerm = `${rawHome}-vs-${rawAway}`.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      return {
        name: 'ScoreBat Highlights',
        type: 'feed' as const,
        url: `https://www.scorebat.com/embed/${searchTerm}/`,
        embedUrl: `https://www.scorebat.com/embed/${searchTerm}/`,
        title: `${rawHome} vs ${rawAway} - Highlights`
      };
    }
  },
  // Final fallback - generic highlight search
  {
    name: 'General Sports Highlights',
    type: 'feed' as const,
    searchFn: async () => {
      console.log(`🔍 [Highlights] Using general sports highlights fallback`);
      
      return {
        name: 'General Sports Highlights',
        type: 'feed' as const,
        url: `https://www.scorebat.com/`,
        embedUrl: `https://www.scorebat.com/embed/`,
        title: `Football Highlights`
      };
    }
  }
  ];

  const tryNextSource = async () => {
    if (sourceIndex >= videoSources.length) {
      // All sources failed, show error with retry option
      console.error(`🎬 [Highlights] All sources failed for: ${primarySearchQuery}`);
      setError('No video sources available');
      setLoading(false);
      return;
    }

    const source = videoSources[sourceIndex];
    try {
      console.log(`🎬 [Highlights] Trying ${source.name} for: ${primarySearchQuery}`);
      const result = await source.searchFn();
      setCurrentSource(result);
      setError(null);
      setLoading(false);
      setIframeError(false); // Reset iframe error when new source is found
      console.log(`✅ [Highlights] Success with ${source.name}:`, result.title);
    } catch (sourceError) {
      console.warn(`❌ [Highlights] ${source.name} failed for "${primarySearchQuery}":`, sourceError);
      setSourceIndex(prev => prev + 1);
      // Continue to next source
    }
  };

  useEffect(() => {
    if (home && away) {
      setLoading(true);
      setError(null);
      setSourceIndex(0);
      setIframeError(false); // Reset iframe error on new search
      tryNextSource();
    }
  }, [home, away, league]);

  // Add timeout to detect videos that fail to load properly
  useEffect(() => {
    if (currentSource && !loading && !error) {
      // Set a timer to check if video is actually playable
      const timeoutId = setTimeout(() => {
        // If we still have a current source but it might be showing "Video unavailable"
        // automatically try the next source
        if (currentSource.type === 'youtube') {
          console.warn(`🎬 [Highlights] YouTube video timeout - may be unavailable: ${currentSource.title}`);
          console.log(`🔄 [Highlights] Automatically trying next source...`);
          setSourceIndex(prev => prev + 1);
        }
      }, 15000); // 15 second timeout for video availability check

      return () => clearTimeout(timeoutId);
    }
  }, [currentSource, loading, error]);

  useEffect(() => {
    if (sourceIndex > 0 && sourceIndex < videoSources.length) {
      tryNextSource();
    } else if (sourceIndex >= videoSources.length && loading) {
      tryNextSource();
    }
  }, [sourceIndex]);

  const handleRetry = () => {
    console.log(`🔄 [Highlights] Manual retry initiated for ${rawHome} vs ${rawAway}`);
    setSourceIndex(0);
    setError(null);
    setLoading(true);
    setIframeError(false); // Reset iframe error on retry
    tryNextSource();
  };

  // Enhanced error messaging for better debugging
  const getErrorMessage = () => {
    if (error?.includes('quota')) {
      return 'API quota exceeded - trying alternative sources';
    }
    if (error?.includes('Network')) {
      return 'Network connection issue - please check your internet';
    }
    return error || 'No video sources available';
  };

  // Check if this is a football/soccer match
  const isFootballMatch = () => {
    // Check league name for football indicators
    const league = leagueName || match?.league?.name || match?.leagueName || '';
    const leagueLower = league.toLowerCase();

    // Enhanced list of non-football sports with more volleyball variations
    const nonFootballSports = [
      'volleyball', 'volley', 'beach volleyball', 'indoor volleyball', 'vóley', 'voleybol',
      'basketball', 'tennis', 'hockey', 'ice hockey', 'field hockey', 'baseball', 
      'cricket', 'rugby', 'american football', 'nfl', 'nba', 'nhl', 'mlb',
      'badminton', 'table tennis', 'ping pong', 'handball', 'water polo', 'golf',
      'athletics', 'swimming', 'cycling', 'boxing', 'mma', 'wrestling', 'judo',
      'esports', 'e-sports', 'gaming', 'dota', 'league of legends', 'cs:go', 'cs2'
    ];

    const isNonFootball = nonFootballSports.some(sport => leagueLower.includes(sport));

    // If it's clearly not football, don't show highlights
    if (isNonFootball) {
      console.log(`🚫 [Highlights] Non-football sport detected: ${league}`);
      return false;
    }

    // Enhanced football indicators
    const footballIndicators = [
      'football', 'soccer', 'fútbol', 'futebol', 'calcio', 'fußball',
      'premier league', 'champions league', 'europa league', 'conference league',
      'la liga', 'serie a', 'bundesliga', 'ligue 1', 'primeira liga', 'eredivisie',
      'fifa', 'uefa', 'copa', 'world cup', 'euro', 'championship', 'league cup',
      'fa cup', 'coupe de france', 'copa del rey', 'dfb-pokal', 'coppa italia',
      'libertadores', 'sudamericana', 'concacaf', 'afc', 'caf', 'ofc',
      'mls', 'usl', 'liga mx', 'brasileirão', 'superliga', 'primeira divisão'
    ];

    const hasFootballIndicators = footballIndicators.some(indicator => leagueLower.includes(indicator));

    // Only return true if we have clear football indicators or no league name
    // This prevents non-football content from showing highlights
    if (hasFootballIndicators) {
      console.log(`✅ [Highlights] Football match confirmed: ${league}`);
      return true;
    }

    // If no clear indicators and we have a league name, assume it's not football
    if (leagueLower) {
      console.log(`❓ [Highlights] Unclear sport, hiding highlights for: ${league}`);
      return false;
    }

    // Default to football only if no league name is available
    return true;
  };

  // Always show the component for debugging purposes
  const isFootball = isFootballMatch();
  console.log(`🎬 [Highlights] Render check:`, {
    isFootball,
    hasError: !!error,
    isLoading: loading,
    hasIframeError: iframeError,
    teams: `${rawHome} vs ${rawAway}`,
    status,
    shouldShowHighlights
  });

  // Additional check: if we have a current source but it's been loading for too long
  // or shows signs of being unavailable, hide the component
  if (currentSource && !loading && !error) {
    // For YouTube specifically, if the embed shows "Video unavailable", we should hide
    // This is detected by the timeout above or manual user feedback
  }

  return (
    <Card className="w-full h-500 shadow-sm border-gray-200">
      <CardHeader className="py-2 px-2">
        <CardTitle className="text-base font-md flex items-center justify-between text-sm text-gray-800">
          <div className="flex items-center">
            Official Highlights
            {!isFootball && <span className="ml-2 text-xs text-red-500">(Non-football detected)</span>}
            {!shouldShowHighlights && <span className="ml-2 text-xs text-orange-500">(Status: {status})</span>}
          </div>
          {currentSource && !loading && (
            <span className="text-xs text-green-600">Source: {currentSource.name}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 px-0">
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-600">
                Searching for highlights...
                {sourceIndex === 0 && isConcacafCompetition && (
                  <span className="block text-xs text-green-500">
                    Checking CONCACAF Official Channel first
                  </span>
                )}
                {sourceIndex === 0 && isFifaClubWorldCup && !isConcacafCompetition && !isBrazilianLeague && (
                  <span className="block text-xs text-blue-500">
                    Checking FIFA Official Channel first
                  </span>
                )}
                {sourceIndex === 0 && isBrazilianLeague && !isConcacafCompetition && !isFifaClubWorldCup && (
                  <span className="block text-xs text-green-600">
                    Checking Canal do Futebol BR first
                  </span>
                )}
                 {sourceIndex === 0 && !isFifaClubWorldCup && !isConcacafCompetition && !isBrazilianLeague && (
                  <span className="block text-xs text-gray-400">
                    Checking YouTube Official Highlights
                  </span>
                )}
                {sourceIndex > 0 && (
                  <span className="block text-xs text-gray-400">
                    Trying {videoSources[sourceIndex]?.name || 'alternative source'}
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : currentSource ? (
          <div className="w-full" style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
            <iframe
              id={`highlights-iframe-${uniqueId}`}
              src={currentSource.embedUrl}
              width="100%"
              height="100%"
              className="fw-iframe"
              scrolling="no"
              frameBorder="0"
              title={currentSource.title || "Football Highlights"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
              onError={() => {
                console.warn(`🎬 [Highlights] Iframe failed for ${currentSource.name}, trying next source`);
                setIframeError(true); // Set iframe error state
                //setSourceIndex(prev => prev + 1);  Do not automatically try next source, let user retry
              }}
              onLoad={(e) => {
                // Check if the iframe content indicates video is unavailable
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  // For YouTube embeds, check if the video is unavailable
                  if (currentSource.type === 'youtube') {
                    // Set a timeout to check the iframe content after it loads
                    setTimeout(() => {
                      try {
                        // Check the iframe's document title or URL for error indicators
                        const iframeSrc = iframe.src;
                        if (iframeSrc.includes('youtube.com/embed/')) {
                          // If we can access the iframe's contentDocument, check for error states
                          // This is limited by CORS, but we can still detect some cases
                          console.log(`🎬 [Highlights] YouTube iframe loaded for ${currentSource.name}`);
                        }
                      } catch (accessError) {
                        // CORS prevents access, which is normal for cross-origin iframes
                        console.log(`🎬 [Highlights] Iframe loaded (CORS protected): ${currentSource.name}`);
                      }
                    }, 2000);
                  }
                } catch (loadError) {
                  console.warn(`🎬 [Highlights] Error checking iframe load state:`, loadError);
                }
              }}
            />
          </div>
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Unable to load highlights</p>
              {error && <p className="text-sm text-red-500 mt-2">{getErrorMessage()}</p>}
              <p className="text-xs text-gray-400 mt-1">Teams: {rawHome} vs {rawAway}</p>
              <p className="text-xs text-gray-400">Status: {status} | Football: {isFootball ? 'Yes' : 'No'}</p>
              <p className="text-xs text-gray-400">Sources tried: {sourceIndex}/{videoSources.length}</p>
              <button onClick={handleRetry} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                Try Again
              </button>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
};

export default MyHighlights;