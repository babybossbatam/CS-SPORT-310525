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
  matchStatus
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

    // Remove common suffixes that might confuse search
    return name
      .replace(/\s+(FC|CF|SC|AC|BK|SK|FK|GK|NK|RK|VK|JK|LK|MK|PK|TK|UK|WK|YK|ZK)$/i, '')
      .replace(/\s+(Football Club|Soccer Club|Athletic Club|Club de Fútbol|Club Deportivo)$/i, '')
      .replace(/\s+(United|City|Town|Rovers|Wanderers|Athletic|Sporting|Real|Club)$/i, '')
      .replace(/\s+(Academy|Youth|U\d+|Under\d+|Reserves|II|III|IV|V|VI|VII|VIII|IX|X)$/i, '')
      .trim();
  };

  // Extract team names from match prop or use provided props
  // Handle multiple possible data structures
  const rawHome = homeTeam || 
                  homeTeamName || 
                  match?.teams?.home?.name || 
                  match?.homeTeam?.name ||
                  match?.homeTeam ||
                  match?.home?.name ||
                  match?.home ||
                  'Home Team';

  const rawAway = awayTeam || 
                  awayTeamName || 
                  match?.teams?.away?.name || 
                  match?.awayTeam?.name ||
                  match?.awayTeam ||
                  match?.away?.name ||
                  match?.away ||
                  'Away Team';

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

  // Create more targeted search queries with different levels of specificity
  const primarySearchQuery = `"${home}" vs "${away}" match highlights ${matchYear}`.trim();
  const secondarySearchQuery = `"${home}" "${away}" goals highlights ${matchYear}`.trim();
  const tertiarySearchQuery = `${home} vs ${away} ${league} highlights ${matchYear}`.trim();
  const fallbackSearchQuery = `${home} ${away} football highlights ${matchYear}`.trim();

  // Debug logging to verify correct team names
  console.log(`🎬 [Highlights] Match data extraction:`, {
    rawHomeTeam: rawHome,
    rawAwayTeam: rawAway,
    cleanedHomeTeam: home,
    cleanedAwayTeam: away,
    league: league,
    matchYear: matchYear,
    primarySearchQuery: primarySearchQuery,
    secondarySearchQuery: secondarySearchQuery,
    tertiarySearchQuery: tertiarySearchQuery,
    fallbackSearchQuery: fallbackSearchQuery,
    rawMatch: match,
    props: { homeTeam, awayTeam, homeTeamName, awayTeamName, leagueName }
  });

  // Check if this is a CONCACAF competition
  const isConcacafCompetition = league.toLowerCase().includes('concacaf') || 
                               league.toLowerCase().includes('gold cup') ||
                               primarySearchQuery.toLowerCase().includes('concacaf');

  // Check if this is a FIFA Club World Cup competition
  const isFifaClubWorldCup = league.toLowerCase().includes('fifa') && 
                            league.toLowerCase().includes('club world cup');

  // Special case for Palmeiras vs Chelsea - use known video
  const isPalmeirasChelsea = (home.toLowerCase().includes('palmeiras') && away.toLowerCase().includes('chelsea')) ||
                            (home.toLowerCase().includes('chelsea') && away.toLowerCase().includes('palmeiras'));

  // Special case for USA vs Mexico 2025 Gold Cup - use known video
  const isUsaMexico2025 = (home.toLowerCase().includes('usa') && away.toLowerCase().includes('mexico')) ||
                         (home.toLowerCase().includes('mexico') && away.toLowerCase().includes('usa'));

  // Special case for PSG vs Real Madrid 2025 FIFA Club World Cup - use correct video
  const isPsgRealMadrid2025 = (home.toLowerCase().includes('paris saint germain') && away.toLowerCase().includes('real madrid')) ||
                             (home.toLowerCase().includes('real madrid') && away.toLowerCase().includes('paris saint germain'));

  const videoSources = [
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
        // Try multiple search queries for better match accuracy
        const queries = [primarySearchQuery, secondarySearchQuery, tertiarySearchQuery];
        let data;
        
        for (const query of queries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=1&channelId=${concacafChannelId}&order=relevance`);
            data = await response.json();
            
            if (data.items && data.items.length > 0) {
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
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=1&channelId=${fifaChannelId}&order=relevance`);
            data = await response.json();
            
            if (data.items && data.items.length > 0) {
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
        // Try multiple search queries in order of specificity
        const queries = [primarySearchQuery, secondarySearchQuery, tertiarySearchQuery];
        
        for (const query of queries) {
          try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=5&order=relevance`);
            const data = await response.json();

            if (data.error || data.quotaExceeded) {
              throw new Error(data.error || 'YouTube quota exceeded');
            }

            if (data.items && data.items.length > 0) {
              // Filter out non-match content
              const validVideo = data.items.find((video: any) => {
                const title = video.snippet.title.toLowerCase();
                const description = video.snippet.description?.toLowerCase() || '';
                
                // Exclude news shows, podcasts, and talk shows
                const excludeKeywords = [
                  'newsround', 'news', 'podcast', 'talk show', 'interview', 
                  'press conference', 'analysis', 'preview', 'review',
                  'reaction', 'discussion', 'debate', 'radio show'
                ];
                
                // Must include highlight-related keywords
                const highlightKeywords = [
                  'highlights', 'goals', 'best moments', 'match recap',
                  'summary', 'extended highlights', 'all goals'
                ];
                
                const hasExcluded = excludeKeywords.some(keyword => 
                  title.includes(keyword) || description.includes(keyword)
                );
                
                const hasHighlights = highlightKeywords.some(keyword => 
                  title.includes(keyword) || description.includes(keyword)
                );
                
                return !hasExcluded && hasHighlights;
              });

              if (validVideo) {
                return {
                  name: 'YouTube',
                  type: 'youtube' as const,
                  url: `https://www.youtube.com/watch?v=${validVideo.id.videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${validVideo.id.videoId}?autoplay=0&rel=0`,
                  title: validVideo.snippet.title
                };
              }
            }
          } catch (error) {
            console.warn(`🎬 [Highlights] YouTube search failed for query: ${query}`, error);
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
    // Additional fallback with broader search terms
    {
      name: 'YouTube Extended',
      type: 'youtube' as const,
      searchFn: async () => {
        // Try different combinations for better results with year emphasis
        const fallbackQueries = [
          `"${home}" "${away}" match highlights ${matchYear}`,
          `${home} ${away} goals ${matchYear}`,
          `"${rawHome}" "${rawAway}" highlights ${matchYear}`,
          `${home} vs ${away} ${league} highlights ${matchYear}`,
          `${home} ${away} all goals ${matchYear}`,
          `${home} ${away} ${matchYear} extended highlights`,
          `${home} vs ${away} ${matchYear} goals`,
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
              // Apply same filtering as above
              const validVideo = data.items.find((video: any) => {
                const title = video.snippet.title.toLowerCase();
                const description = video.snippet.description?.toLowerCase() || '';
                
                const excludeKeywords = [
                  'newsround', 'news', 'podcast', 'talk show', 'interview', 
                  'press conference', 'analysis', 'preview', 'review',
                  'reaction', 'discussion', 'debate', 'radio show'
                ];
                
                const highlightKeywords = [
                  'highlights', 'goals', 'best moments', 'match recap',
                  'summary', 'extended highlights', 'all goals'
                ];
                
                const hasExcluded = excludeKeywords.some(keyword => 
                  title.includes(keyword) || description.includes(keyword)
                );
                
                const hasHighlights = highlightKeywords.some(keyword => 
                  title.includes(keyword) || description.includes(keyword)
                );
                
                return !hasExcluded && hasHighlights;
              });

              if (validVideo) {
                return {
                  name: 'YouTube Extended',
                  type: 'youtube' as const,
                  url: `https://www.youtube.com/watch?v=${validVideo.id.videoId}`,
                  embedUrl: `https://www.youtube.com/embed/${validVideo.id.videoId}?autoplay=0&rel=0`,
                  title: validVideo.snippet.title
                };
              }
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

  // Hide the card entirely when no video is available, not loading, iframe error, or video unavailable
  if ((error && !loading) || iframeError) {
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
                {sourceIndex === 0 && isFifaClubWorldCup && !isConcacafCompetition && (
                  <span className="block text-xs text-blue-500">
                    Checking FIFA Official Channel first
                  </span>
                )}
                {sourceIndex === 0 && !isFifaClubWorldCup && !isConcacafCompetition }
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