import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

interface MyHighlightsProps {
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  matchStatus?: string;
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

const MyHighlights: React.FC<MyHighlightsProps> = ({
  homeTeam,
  awayTeam,
  leagueName,
  matchStatus = "NS"
}) => {
  const [videoData, setVideoData] = useState<YouTubeVideo | null>(null);
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

  const searchForHighlights = async () => {
    if (!homeTeam || !awayTeam) {
      setError('Team names are required for highlights search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Strategy 1: Search for live videos across all channels
      for (const channelId of HIGHLIGHT_CHANNELS) {
        try {
          const liveApiUrl = `/api/youtube/search?channelId=${channelId}&eventType=live`;

          const liveResponse = await fetch(liveApiUrl);
          const liveData = await liveResponse.json();

          if (liveData.items && liveData.items.length > 0) {
            const liveMatch = liveData.items.find((item: YouTubeVideo) => {
              const title = item.snippet.title.toLowerCase();
              return title.includes(homeTeam.toLowerCase()) && title.includes(awayTeam.toLowerCase());
            });

            if (liveMatch) {
              setVideoData(liveMatch);
              setIsLoading(false);
              return;
            }
          }
        } catch (channelError) {
          console.warn(`Failed to search live videos on channel ${channelId}:`, channelError);
        }
      }

      // Strategy 2: Search for highlights on specific channels first
      for (const channelId of HIGHLIGHT_CHANNELS) {
        try {
          const query = encodeURIComponent(`${homeTeam} ${awayTeam} highlights ${leagueName || ''}`);
          const highlightApiUrl = `/api/youtube/search?channelId=${channelId}&maxResults=10&order=relevance&q=${query}`;

          const highlightResponse = await fetch(highlightApiUrl);
          const highlightData = await highlightResponse.json();

          if (highlightData.error) {
            console.warn(`API error for channel ${channelId}:`, highlightData.error.message);
            continue;
          }

          if (highlightData.items && highlightData.items.length > 0) {
            // Find perfect match with both team names
            const perfectMatch = highlightData.items.find((item: YouTubeVideo) => {
              const title = item.snippet.title.toLowerCase();
              return title.includes(homeTeam.toLowerCase()) && title.includes(awayTeam.toLowerCase());
            });

            if (perfectMatch) {
              setVideoData(perfectMatch);
              setIsLoading(false);
              return;
            }

            // Store first good result as fallback
            if (!videoData) {
              const goodMatch = highlightData.items.find((item: YouTubeVideo) => {
                const title = item.snippet.title.toLowerCase();
                return title.includes(homeTeam.toLowerCase()) || title.includes(awayTeam.toLowerCase());
              });
              if (goodMatch) {
                setVideoData(goodMatch);
              }
            }
          }
        } catch (channelError) {
          console.warn(`Failed to search highlights on channel ${channelId}:`, channelError);
        }
      }

      // Strategy 3: General YouTube search if channel-specific searches fail
      if (!videoData) {
        try {
          const generalQuery = encodeURIComponent(`${homeTeam} vs ${awayTeam} highlights ${leagueName || ''}`);
          const generalApiUrl = `/api/youtube/search?maxResults=15&order=relevance&q=${generalQuery}`;

          const generalResponse = await fetch(generalApiUrl);
          const generalData = await generalResponse.json();

          if (generalData.items && generalData.items.length > 0) {
            // Find best match from general search
            const bestMatch = generalData.items.find((item: YouTubeVideo) => {
              const title = item.snippet.title.toLowerCase();
              const description = item.snippet.description.toLowerCase();

              // Check for both teams in title or description
              const hasHomeTeam = title.includes(homeTeam.toLowerCase()) || description.includes(homeTeam.toLowerCase());
              const hasAwayTeam = title.includes(awayTeam.toLowerCase()) || description.includes(awayTeam.toLowerCase());

              return hasHomeTeam && hasAwayTeam;
            });

            if (bestMatch) {
              setVideoData(bestMatch);
            } else {
              // Last resort: any video mentioning either team
              const anyMatch = generalData.items.find((item: YouTubeVideo) => {
                const title = item.snippet.title.toLowerCase();
                return title.includes(homeTeam.toLowerCase()) || title.includes(awayTeam.toLowerCase());
              });

              if (anyMatch) {
                setVideoData(anyMatch);
              }
            }
          }
        } catch (generalError) {
          console.error('General search failed:', generalError);
        }
      }

      // If we have data at this point, we're done
      if (videoData) {
        setIsLoading(false);
        return;
      }

      // If still no results, show helpful error
      setError(`No highlight videos found for ${homeTeam} vs ${awayTeam}. This match may be too recent or from a less covered league.`);

    } catch (err) {
      console.error('Error fetching highlights:', err);
      setError('Failed to load highlight videos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (homeTeam && awayTeam) {
      searchForHighlights();
    }
  }, [homeTeam, awayTeam, leagueName]);

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

  if (!homeTeam || !awayTeam) {
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
            {error.includes('embedding restrictions') || error.includes('blocked') ? (
              <div className="flex gap-2">
                <button
                  onClick={() => videoData && window.open(`https://www.youtube.com/watch?v=${videoData.id.videoId}`, '_blank')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch on YouTube
                </button>
                <button
                  onClick={searchForHighlights}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Find Alternative
                </button>
              </div>
            ) : (
              <button
                onClick={searchForHighlights}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            )}
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
                  src={videoData.snippet.thumbnails.medium.url}
                  alt={videoData.snippet.title}
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
                      {videoData.snippet.channelTitle}
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
                  <iframe
                    id={`youtube-player-${videoData.id.videoId}`}
                    src={`https://www.youtube.com/embed/${videoData.id.videoId}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}&enablejsapi=1&controls=1&showinfo=0&color=white&iv_load_policy=3`}
                    title={videoData.snippet.title}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; autoplay"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    onError={(e) => {
                      console.error('YouTube iframe failed to load:', e);
                      setError('This video cannot be played here due to embedding restrictions. Please use the "Watch on YouTube" button below.');
                      setShowEmbed(false);
                    }}
                    onLoad={() => {
                      console.log('YouTube iframe loaded successfully');
                      setTimeout(() => {
                        const iframe = document.getElementById(`youtube-player-${videoData.id.videoId}`) as HTMLIFrameElement;
                        if (iframe) {
                          try {
                            if (iframe.contentWindow) {
                              console.log('YouTube player iframe is accessible');
                            }
                          } catch (e) {
                            console.log('YouTube iframe has normal cross-origin restrictions');
                          }
                          const rect = iframe.getBoundingClientRect();
                          if (rect.height < 100) {
                            console.warn('YouTube iframe may be blocked - unusually small height');
                            setError('Video embedding may be restricted. Try the "Watch on YouTube" button.');
                          }
                        }
                      }, 3000);
                    }}
                  />
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
                  <span className="text-white text-xs font-medium">Playing...</span>
                </div>
              </div>
            )}

            {/* Video Info */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                {videoData.snippet.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{videoData.snippet.channelTitle}</span>
                <span>{formatPublishDate(videoData.snippet.publishedAt)}</span>
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
                <button
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${videoData.id.videoId}`, '_blank')}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </button>
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