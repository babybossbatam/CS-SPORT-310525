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

  // Only show highlights for ended matches
  const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(status);

  // Don't render if match is not ended
  if (!isEnded) {
    return null;
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
  const rawHome = homeTeamData?.name ||
                  match?.teams?.home?.name || 
                  match?.homeTeam?.name ||
                  match?.homeTeam ||
                  match?.home?.name ||
                  match?.home ||
                  homeTeam || 
                  homeTeamName || 
                  'Home Team';

  const rawAway = awayTeamData?.name ||
                  match?.teams?.away?.name || 
                  match?.awayTeam?.name ||
                  match?.awayTeam ||
                  match?.away?.name ||
                  match?.away ||
                  awayTeam || 
                  awayTeamName || 
                  'Away Team';

  // Validate that we have actual team names and not fallbacks
  const hasValidTeamNames = rawHome !== 'Home Team' && rawAway !== 'Away Team' && 
                           rawHome && rawAway && 
                           rawHome.trim() !== '' && rawAway.trim() !== '';

  if (!hasValidTeamNames) {
    console.warn(`🎬 [Highlights] Invalid team names detected:`, {
      rawHome,
      rawAway,
      homeTeamData,
      awayTeamData,
      match: match?.teams
    });
    return null; // Don't show highlights if we don't have proper team names
  }

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
  const broadSearchQuery = `${rawHome} ${rawAway} highlights ${matchYear} ${teamExclusions}`.trim();
  
  // Year-flexible search for older matches
  const flexibleYearQuery = `"${rawHome}" vs "${rawAway}" highlights ${teamExclusions}`.trim();

  // Additional exclusions for Brazilian league confusion
  const brazilianSafeQuery = isBrazilianLeague ? 
    `"${rawHome}" vs "${rawAway}" brasileiro ${matchYear} melhores momentos ${teamExclusions}`.trim() :
    primarySearchQuery;

  const fallbackSearchQuery = `${home} vs ${away} highlights -virtual -gaming -esoccer -app -botafogo -psg`.trim();

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
      exactTeamMatchQuery,
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

    // If both teams found, check if home comes before away
    if (homePos !== -1 && awayPos !== -1) {
      return homePos < awayPos;
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
      const vsKeywords = ['vs', 'v ', 'versus', ' x ', ' - ', ' against '];
      if (vsKeywords.some(keyword => teamSection.includes(keyword))) {
        score += 10;
      }
    } else if (exactHomeMatch || exactAwayMatch) {
      score += 50; // Good bonus for one exact match
    }

    // Check for partial team name matches
    const homeWords = homeLower.split(' ').filter(word => word.length > 2);
    const awayWords = awayLower.split(' ').filter(word => word.length > 2);
    
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

    // Check for exact team name matches with partial matching
    const homeMatches = homeLower.split(' ').filter(word => word.length > 2 && titleLower.includes(word));
    const awayMatches = awayLower.split(' ').filter(word => word.length > 2 && titleLower.includes(word));

    const homePos = titleLower.indexOf(homeLower);
    const awayPos = titleLower.indexOf(awayLower);

    // Extra bonus for exact full team name matches (helps with similar team names)
    const exactHomeMatch = titleLower.includes(homeLower);
    const exactAwayMatch = titleLower.includes(awayLower);

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
    // Brazilian Highlights Channel - PREFERRED option for Brazilian leagues (but not exclusive)
    ...(isBrazilianLeague ? [{
      name: 'Canal do Futebol BR',
      type: 'youtube' as const,
      searchFn: async () => {
        const brazilianChannelId = 'UCw5-xj3AKqEizC7MvHaIPqA';

        // Special exclusions for commonly confused Brazilian teams
        const getTeamExclusions = (teamName: string) => {
          const exclusions = ['-botafogo-sp', '-atletico-pr', '-athletico-pr'];

          // If we're looking for main Botafogo, exclude Botafogo-SP
          if (teamName.toLowerCase().includes('botafogo') && !teamName.toLowerCase().includes('sp')) {
            exclusions.push('-"botafogo-sp"', '-"botafogo sp"');
          }

          // If we're looking for Sport Recife, be very specific
          if (teamName.toLowerCase().includes('sport') && teamName.toLowerCase().includes('recife')) {
            exclusions.push('-"sport club"', '-"sporting"');
          }

          return exclusions.join(' ');
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

            if (data.items && data.items.length > 0) {
              // Filter and sort by title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);
              data.items = sortedVideos;
              if (sortedVideos.length > 0) {
                break;
              }
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] Canal do Futebol BR search failed for query: ${query}`, error);
            continue;
          }
        }

        if (data.error || data.quotaExceeded) {
          throw new Error(data.error || 'Canal do Futebol BR search failed');
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
          throw new Error(data.error || 'FIFA official channel search failed');
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
      name: 'YouTube',
      type: 'youtube' as const,
      searchFn: async () => {
        // Create dynamic query list based on league type and match characteristics
        let queries;
        
        if (isBrazilianLeague) {
          // For Brazilian matches, prioritize Portuguese terms and broader search
          queries = [
            primarySearchQuery, // Most specific with team exclusions
            `"${rawHome}" x "${rawAway}" melhores momentos ${matchYear} ${teamExclusions}`,
            `"${rawHome}" vs "${rawAway}" brasileiro ${matchYear} ${teamExclusions}`,
            `${home} vs ${away} serie a ${matchYear} highlights ${teamExclusions}`,
            brazilianSafeQuery,
            secondarySearchQuery,
            broadSearchQuery,
            flexibleYearQuery
          ];
        } else {
          // For non-Brazilian matches, use strategic ordering
          queries = [
            primarySearchQuery, // Most specific search
            leagueSpecificQuery, // League context helps
            secondarySearchQuery, // Cleaned team names
            broadSearchQuery, // Broader search without quotes
            flexibleYearQuery, // Year-flexible for older matches
            brazilianSafeQuery // Fallback
          ];
        }

        // Add league-specific optimizations
        if (league) {
          const leagueTerms = league.toLowerCase();
          if (leagueTerms.includes('champions league')) {
            queries.unshift(`"${rawHome}" vs "${rawAway}" "champions league" ${matchYear} highlights ${teamExclusions}`);
          } else if (leagueTerms.includes('premier league')) {
            queries.unshift(`"${rawHome}" vs "${rawAway}" "premier league" ${matchYear} highlights ${teamExclusions}`);
          } else if (leagueTerms.includes('la liga')) {
            queries.unshift(`"${rawHome}" vs "${rawAway}" "la liga" ${matchYear} highlights ${teamExclusions}`);
          }
        }

        for (let i = 0; i < queries.length; i++) {
          const query = queries[i];
          try {
            console.log(`🔍 [Highlights] Trying query ${i + 1}/${queries.length} for ${rawHome} vs ${rawAway}: "${query}"`);
            
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=15&order=relevance`);
            const data = await response.json();

            if (data.error || data.quotaExceeded) {
              console.warn(`❌ [Highlights] Query ${i + 1} failed:`, data.error || 'YouTube quota exceeded');
              throw new Error(data.error || 'YouTube quota exceeded');
            }

            if (data.items && data.items.length > 0) {
              console.log(`📝 [Highlights] Query ${i + 1} returned ${data.items.length} raw results`);
              
              // Filter and sort by relevance and title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);

              console.log(`🎯 [Highlights] Query ${i + 1} after filtering: ${sortedVideos.length} relevant videos`);
              console.log(`🎬 [Highlights] Top 3 results for "${query}":`, sortedVideos.slice(0, 3).map(v => ({
                title: v.snippet?.title,
                channelTitle: v.snippet?.channelTitle,
                relevanceScore: v.relevanceScore,
                correctOrder: v.correctOrder,
                combinedScore: v.combinedScore
              })));

              if (sortedVideos.length > 0) {
                const video = sortedVideos[0];
                console.log(`✅ [Highlights] Selected video from query ${i + 1}:`, {
                  title: video.snippet.title,
                  channel: video.snippet.channelTitle,
                  score: video.combinedScore
                });
                return {
                  name: 'YouTube',
                  type: 'youtube' as const,
                  url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
                  title: video.snippet.title
                };
              } else {
                console.log(`⚠️ [Highlights] Query ${i + 1} had results but none passed filtering`);
              }
            } else {
              console.log(`📭 [Highlights] Query ${i + 1} returned no results`);
            }
          } catch (error) {
            console.warn(`❌ [Highlights] Query ${i + 1} failed for: ${query}`, error);
            continue;
          }
        }
        throw new Error('No YouTube videos found');
      }
    },
    {
      name: 'Vimeo',
      type: 'vimeo' as const,
      searchFn: async () => {
        const response = await fetch(`/api/vimeo/search?q=${encodeURIComponent(primarySearchQuery)}&maxResults=1`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          return {
            name: 'Vimeo',
            type: 'vimeo' as const,
            url: video.url,
            embedUrl: `https://player.vimeo.com/video/${video.id}?autoplay=0`,
            title: video.title
          };
        }
        throw new Error('No Vimeo videos found');
      }
    },
    {
      name: 'Dailymotion',
      type: 'dailymotion' as const,
      searchFn: async () => {
        const response = await fetch(`/api/dailymotion/search?q=${encodeURIComponent(primarySearchQuery)}&maxResults=1`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          return {
            name: 'Dailymotion',
            type: 'dailymotion' as const,
            url: `https://www.dailymotion.com/video/${video.id}`,
            embedUrl: `https://www.dailymotion.com/embed/video/${video.id}?autoplay=0`,
            title: video.title
          };
        }
        throw new Error('No Dailymotion videos found');
      }
    },
    // Additional Brazilian-focused search (broader channels)
    ...(isBrazilianLeague ? [{
      name: 'YouTube Brazilian Extended',
      type: 'youtube' as const,
      searchFn: async () => {
        // Very broad Brazilian football search terms
        const brazilianQueries = [
          `${rawHome} ${rawAway} ${matchYear}`,
          `${home} ${away} futebol ${matchYear}`,
          `${home} vs ${away} brasileiro`,
          `${rawHome} x ${rawAway} gols`,
          `"${home}" "${away}" highlights`,
          `${home} ${away} resumo ${matchYear}`
        ];

        for (const query of brazilianQueries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=20&order=relevance`);
            const data = await response.json();

            if (data.error || data.quotaExceeded) {
              continue; // Try next query
            }

            if (data.items && data.items.length > 0) {
              // Filter and sort by title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);
              if (sortedVideos.length > 0) {
                const video = sortedVideos[0];
                return {
                  name: 'YouTube Brazilian Extended',
                  type: 'youtube' as const,
                  url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
                  title: video.snippet.title
                };
              }
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] Brazilian extended search failed for query: ${query}`, error);
            continue;
          }
        }
        throw new Error('No Brazilian extended videos found');
      }
    }] : []),
    // Additional fallback with broader search terms
    {
      name: 'YouTube Extended',
      type: 'youtube' as const,
      searchFn: async () => {
        // Try different combinations for better results with year emphasis and exact order
        const fallbackQueries = [
          `"${home}" v "${away}" highlights ${matchYear}`,
          `"${home}" vs "${away}" highlights ${matchYear}`,
          `${home} ${away} highlights football ${matchYear}`,
          `"${rawHome}" v "${rawAway}" highlights ${matchYear}`,
          `${home} vs ${away} ${league} ${matchYear}`,
          `${home} ${away} goals highlights ${matchYear}`,
          `${home} ${away} ${matchYear} match highlights`,
          `${home} vs ${away} ${matchYear}`,
          fallbackSearchQuery
        ];

        for (const query of fallbackQueries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=5&order=relevance`);
            const data = await response.json();

            if (data.error || data.quotaExceeded) {
              continue; // Try next query
            }

            if (data.items && data.items.length > 0) {
              // Filter and sort by title order preference
              const sortedVideos = filterAndSortVideos(data.items, home, away);
              const video = sortedVideos[0];
              return {
                name: 'YouTube Extended',
                type: 'youtube' as const,
                url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
                title: video.snippet.title
              };
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] Extended search failed for query: ${query}`, error);
            continue;
          }
        }
        throw new Error('No extended YouTube videos found');
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
        // we should hide the component after a reasonable wait time
        if (currentSource.type === 'youtube') {
          console.warn(`🎬 [Highlights] YouTube video timeout - may be unavailable: ${currentSource.title}`);

        }
      }, 10000); // 10 second timeout for video availability check

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
    setSourceIndex(0);
    setError(null);
    setLoading(true);
    setIframeError(false); // Reset iframe error on retry
    tryNextSource();
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

  // Hide the card entirely when no video is available, not loading, iframe error, or video unavailable
  if (!isFootballMatch() || (error && !loading) || iframeError) {
    return null;
  }

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
          </div>
          {currentSource && !loading  }
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
                 {sourceIndex === 0 && !isFifaClubWorldCup && !isConcacafCompetition && !isBrazilianLeague }
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
              <p className="text-sm text-gray-600">No highlights available</p>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
};

export default MyHighlights;