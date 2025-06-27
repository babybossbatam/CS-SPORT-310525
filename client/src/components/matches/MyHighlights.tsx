import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

interface MyHighlightsProps {
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  matchStatus?: string;
  match?: any; // Full match object from MyMatchdetailsScoreboard
  matchId?: string;
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    publishedAt: string;
    channelTitle: string;
  };
}

interface VideoData {
  platform: string;
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  watchUrl: string;
}

const MyHighlights: React.FC<MyHighlightsProps> = ({
  homeTeam,
  awayTeam,
  leagueName,
  matchStatus = "NS",
  match,
  matchId
}) => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);


  // Use server-side proxy instead of direct API calls

  // Multiple reliable channels for football highlights
  const HIGHLIGHT_CHANNELS = [
    'UCaopyJz-EIXOXYXSMOC6c-g', // Original channel
    'UCKlcfZ3svGyESsxQCcV_x5g', // ESPN FC
    'UC6yW44UGJJBvYTlfC7CRg2Q', // beIN Sports
    'UCpcTrCXblq78GZrTUTLWeBw', // Sky Sports Football
    'UCRfhZMRWLBpNnZ5nfKgL4-w', // BT Sport Football
    'UCq6aw03fnIBFWs2fqgP32pA', // Goal
    'UCYO_jab_esuFRV4b17AJtAw'  // 3 Players
  ];

  // Local cache for video searches (24 hour cache)
  const [searchCache] = useState(() => new Map());

  const searchForHighlights = async () => {
    const { home, away, league } = teamData;
    
    if (!home || !away) {
      setError('Team names are required for highlights search');
      return;
    }

    // Create cache key
    const cacheKey = `${home}_${away}_${league || ''}`.toLowerCase().replace(/\s+/g, '_');
    
    // Check cache first (24 hour expiry)
    const cached = searchCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < 24 * 60 * 60 * 1000)) {
      console.log('🎯 Using cached highlight data for:', cacheKey);
      setVideoData(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Strategy 1: Try ScoreBat first - always available, no API limits
      console.log('🏈 Trying ScoreBat as primary source for highlights');
      const scorebatData = {
        platform: 'scorebat',
        id: 'embed-feed',
        title: `${home} vs ${away} - Football Highlights`,
        description: 'Live football highlights and match videos from ScoreBat. Watch directly on this page.',
        thumbnailUrl: '/assets/no-logo-available.png',
        channelTitle: 'ScoreBat',
        publishedAt: new Date().toISOString(),
        watchUrl: 'https://www.scorebat.com/embed/videofeed/?token=MjExNjkxXzE3NTEwMDI4MzlfNzNkZmJkODBjMWNiZGFjZDhkMDNhNjM3OTI0MDA0ZGI0NjFkMDIwNw=='
      };

      // Cache the ScoreBat result
      searchCache.set(cacheKey, {
        data: scorebatData,
        timestamp: now
      });

      setVideoData(scorebatData);
      setIsLoading(false);
      return;

    } catch (err) {
      console.error('Error with ScoreBat:', err);
      
      // Fallback to YouTube and other platforms if ScoreBat fails
      try {
        const topChannels = [
          'UCKlcfZ3svGyESsxQCcV_x5g', // ESPN FC
          'UCpcTrCXblq78GZrTUTLWeBw', // Sky Sports Football
          'UCq6aw03fnIBFWs2fqgP32pA'  // Goal
        ];

        const query = encodeURIComponent(`${home} vs ${away} highlights ${league || ''}`);
        
        for (const channelId of topChannels) {
          try {
            const apiUrl = `/api/youtube/search?channelId=${channelId}&maxResults=5&order=date&q=${query}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
              if (data.error.includes('quota')) {
                setError('YouTube quota exceeded. Switching to alternative video sources...');
                await searchAlternativePlatforms();
                return;
              }
              continue;
            }

            if (data.items && data.items.length > 0) {
              const perfectMatch = data.items.find((item: YouTubeVideo) => {
                const title = item.snippet.title.toLowerCase();
                return title.includes(home.toLowerCase()) && title.includes(away.toLowerCase());
              });

              if (perfectMatch) {
                const videoData = {
                  platform: 'youtube',
                  id: perfectMatch.id.videoId,
                  title: perfectMatch.snippet.title,
                  description: perfectMatch.snippet.description,
                  thumbnailUrl: perfectMatch.snippet.thumbnails.medium.url,
                  channelTitle: perfectMatch.snippet.channelTitle,
                  publishedAt: perfectMatch.snippet.publishedAt,
                  watchUrl: `https://www.youtube.com/watch?v=${perfectMatch.id.videoId}`
                };

                searchCache.set(cacheKey, {
                  data: videoData,
                  timestamp: now
                });

                setVideoData(videoData);
                setIsLoading(false);
                return;
              }
            }
          } catch (channelError) {
            console.warn(`Failed to search on channel ${channelId}:`, channelError);
          }
        }

        // If YouTube also fails, try other alternative platforms
        await searchAlternativePlatforms();
      } catch (fallbackError) {
        console.error('All video sources failed:', fallbackError);
        setError('Failed to load highlight videos. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative platform search when YouTube quota is exceeded
  const searchAlternativePlatforms = async () => {
    const queries = [
      `${teamData.home} vs ${teamData.away} highlights`,
      `${teamData.home} ${teamData.away} highlights`,
      `${teamData.home} vs ${teamData.away}`,
      `${teamData.home} ${teamData.away} goals`,
      `${teamData.league || ''} highlights ${teamData.home} ${teamData.away}`.trim()
    ];
    
    try {
      // Try multiple search variations for Vimeo
      for (const query of queries) {
        try {
          const vimeoResponse = await fetch(`/api/vimeo/search?q=${encodeURIComponent(query)}&maxResults=10`);
          
          if (vimeoResponse.ok) {
            const vimeoData = await vimeoResponse.json();
            
            if (vimeoData.items && vimeoData.items.length > 0) {
              // More flexible matching - check for either team name
              const vimeoMatch = vimeoData.items.find((item: any) => {
                const title = item.title?.toLowerCase() || '';
                const homeMatch = title.includes(teamData.home.toLowerCase());
                const awayMatch = title.includes(teamData.away.toLowerCase());
                const hasHighlights = title.includes('highlight') || title.includes('goal') || title.includes('vs');
                
                return (homeMatch || awayMatch) && hasHighlights;
              }) || vimeoData.items[0]; // Fallback to first result

              if (vimeoMatch && vimeoMatch.title) {
                setVideoData({
                  platform: 'vimeo',
                  id: vimeoMatch.id,
                  title: vimeoMatch.title,
                  description: vimeoMatch.description || '',
                  thumbnailUrl: vimeoMatch.thumbnail || '',
                  channelTitle: vimeoMatch.user_name || 'Vimeo User',
                  publishedAt: vimeoMatch.created_time || new Date().toISOString(),
                  watchUrl: vimeoMatch.url || `https://vimeo.com/${vimeoMatch.id}`
                });
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (vimeoError) {
          console.warn(`Vimeo search failed for query "${query}":`, vimeoError);
          continue;
        }
      }

      // Try multiple search variations for Dailymotion
      for (const query of queries) {
        try {
          const dailymotionResponse = await fetch(`/api/dailymotion/search?q=${encodeURIComponent(query)}&maxResults=10`);
          
          if (dailymotionResponse.ok) {
            const dailymotionData = await dailymotionResponse.json();
            
            if (dailymotionData.items && dailymotionData.items.length > 0) {
              // More flexible matching
              const dailymotionMatch = dailymotionData.items.find((item: any) => {
                const title = item.title?.toLowerCase() || '';
                const homeMatch = title.includes(teamData.home.toLowerCase());
                const awayMatch = title.includes(teamData.away.toLowerCase());
                const hasHighlights = title.includes('highlight') || title.includes('goal') || title.includes('vs');
                
                return (homeMatch || awayMatch) && hasHighlights;
              }) || dailymotionData.items[0]; // Fallback to first result

              if (dailymotionMatch && dailymotionMatch.title) {
                setVideoData({
                  platform: 'dailymotion',
                  id: dailymotionMatch.id,
                  title: dailymotionMatch.title,
                  description: dailymotionMatch.description || '',
                  thumbnailUrl: dailymotionMatch.thumbnail_240_url || '',
                  channelTitle: dailymotionMatch.owner || 'Dailymotion User',
                  publishedAt: dailymotionMatch.created_time || new Date().toISOString(),
                  watchUrl: `https://www.dailymotion.com/video/${dailymotionMatch.id}`
                });
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (dailymotionError) {
          console.warn(`Dailymotion search failed for query "${query}":`, dailymotionError);
          continue;
        }
      }

      // Try Twitch as fallback (currently returns empty results but infrastructure is ready)
      try {
        const twitchResponse = await fetch(`/api/twitch/search?q=${encodeURIComponent(queries[0])}&maxResults=5`);
        
        if (twitchResponse.ok) {
          const twitchData = await twitchResponse.json();
          
          if (twitchData.items && twitchData.items.length > 0) {
            const twitchMatch = twitchData.items[0]; // Use first result for now
            
            if (twitchMatch && twitchMatch.title) {
              setVideoData({
                platform: 'twitch',
                id: twitchMatch.id,
                title: twitchMatch.title,
                description: twitchMatch.description || '',
                thumbnailUrl: twitchMatch.thumbnail || '',
                channelTitle: twitchMatch.broadcaster_name || 'Twitch User',
                publishedAt: twitchMatch.created_at || new Date().toISOString(),
                watchUrl: twitchMatch.url || `https://www.twitch.tv/videos/${twitchMatch.id}`
              });
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (twitchError) {
        console.warn('Twitch search failed:', twitchError);
      }

      // If no alternatives found after trying all sources
      setError(`No highlight videos found for ${teamData.home} vs ${teamData.away}. All video sources are currently unavailable.`);
    } catch (altError) {
      console.error('Alternative platform search failed:', altError);
      setError(`YouTube quota exceeded. Alternative video platforms are temporarily unavailable. Quota resets daily at midnight PST.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract team names from match object if available
  const getTeamNames = () => {
    if (match) {
      return {
        home: match.teams?.home?.name || homeTeam,
        away: match.teams?.away?.name || awayTeam,
        league: match.league?.name || leagueName,
        status: match.fixture?.status?.short || matchStatus
      };
    }
    return {
      home: homeTeam,
      away: awayTeam,
      league: leagueName,
      status: matchStatus
    };
  };

  const teamData = getTeamNames();

  useEffect(() => {
    if (teamData.home && teamData.away) {
      searchForHighlights();
    }
  }, [teamData.home, teamData.away, teamData.league, match?.fixture?.id]);

  const formatPublishDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  const handleToggleEmbed = () => {
    setShowEmbed(!showEmbed);
  };

  if (!teamData.home || !teamData.away) {
    return null;
  }

  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold flex items-center text-gray-800">
          <Play className="h-4 w-4 mr-2 text-red-500" />
          Official Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading highlights...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">{error}</span>
            </div>
            {error.includes('quota') && (
              <div className="text-xs text-gray-600 text-center">
                YouTube API quota exceeded. This resets daily at midnight PST.
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={searchForHighlights}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Find Alternative Source
              </button>
              {videoData && (
                <button
                  onClick={() => setShowEmbed(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Try Embedded Player
                </button>
              )}
            </div>
          </div>
        )}

        {videoData && (
          <div className="space-y-3">
            {!showEmbed ? (
              /* 365scores-style Video Thumbnail */
              <div 
                className="relative w-full cursor-pointer group rounded-lg overflow-hidden bg-gray-900 shadow-lg"
                style={{ paddingBottom: '56.25%' }}
                onClick={handleToggleEmbed}
              >
                <img
                  src={videoData.thumbnailUrl}
                  alt={videoData.title}
                  className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-75"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:from-black/70 transition-all duration-300"></div>

                {/* Play Button Overlay - 365scores style */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:bg-white transition-all duration-300 shadow-lg">
                    <Play className="h-5 w-5 text-gray-800 ml-0.5" fill="currentColor" />
                  </div>
                </div>

                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Highlights</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {videoData.channelTitle}
                    </div>
                  </div>
                </div>

                {/* Quality Badge */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                  <span className="text-white text-xs font-medium">HD</span>
                </div>
              </div>
            ) : (
              /* 365scores-style Embedded Player */
              <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-xl">
                <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                  {videoData.platform === 'youtube' ? (
                    <iframe
                      id={`youtube-player-${videoData.id}`}
                      src={`https://www.youtube.com/embed/${videoData.id}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}&enablejsapi=1&controls=1&showinfo=0&color=white&iv_load_policy=3`}
                      title={videoData.title}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; autoplay"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      onError={() => setError('Video embedding restricted. Use "Open" button below.')}
                    />
                  ) : videoData.platform === 'vimeo' ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoData.id}?autoplay=1&color=ffffff`}
                      title={videoData.title}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoData.platform === 'dailymotion' ? (
                    <iframe
                      src={`https://www.dailymotion.com/embed/video/${videoData.id}?autoplay=1`}
                      title={videoData.title}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  ) : videoData.platform === 'twitch' ? (
                    <iframe
                      src={`https://player.twitch.tv/?video=${videoData.id}&parent=${window.location.hostname}&autoplay=true`}
                      title={videoData.title}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  ) : videoData.platform === 'scorebat' ? (
                    <div className="relative w-full h-full">
                      <iframe
                        src="https://www.scorebat.com/embed/videofeed/?token=MjExNjkxXzE3NTEwMDI4MzlfNzNkZmJkODBjMWNiZGFjZDhkMDNhNjM3OTI0MDA0ZGI0NjFkMDIwNw=="
                        title="ScoreBat Football Highlights"
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allow="autoplay; fullscreen; encrypted-media"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'block' }}
                        onError={() => {
                          console.error('ScoreBat iframe failed to load - CSP or network issue');
                        }}
                        onLoad={() => console.log('ScoreBat iframe loaded successfully')}
                      />
                      <script
                        dangerouslySetInnerHTML={{
                          __html: `
                            (function(d, s, id) { 
                              var js, fjs = d.getElementsByTagName(s)[0]; 
                              if (d.getElementById(id)) return; 
                              js = d.createElement(s); 
                              js.id = id; 
                              js.src = 'https://www.scorebat.com/embed/embed.js?v=arrv'; 
                              fjs.parentNode.insertBefore(js, fjs); 
                            }(document, 'script', 'scorebat-jssdk'));
                          `
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Minimal close button */}
                <button
                  onClick={handleToggleEmbed}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-all duration-200 z-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Video Quality Indicator */}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded px-2 py-1 z-10">
                  <span className="text-white text-xs font-medium">
                    {videoData.platform === 'scorebat' ? 'ScoreBat' : videoData.platform.charAt(0).toUpperCase() + videoData.platform.slice(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Video Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                {videoData.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{videoData.channelTitle}</span>
                <span>{formatPublishDate(videoData.publishedAt)}</span>
              </div>

              {/* 365scores-style Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleToggleEmbed}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="h-4 w-4" />
                  {showEmbed ? 'Back to Preview' : 'Watch Highlights'}
                </button>
                {!showEmbed && (
                  <button
                    onClick={handleToggleEmbed}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Play className="h-4 w-4" />
                    Play Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && !videoData && (
          <div className="text-center p-6 text-gray-500 space-y-3">
            <Play className="h-8 w-8 mx-auto text-gray-300" />
            <p className="text-sm">No highlights available</p>
            <button
              onClick={searchForHighlights}
              className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHighlights;