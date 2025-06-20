
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
  

  // YouTube API Configuration with reliable channels
  const API_KEY = 'AIzaSyA_hEdy01ChpBkp3MWKBmda6DsDDbcCw-o';
  
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
          const liveApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;
          
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
          const highlightApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=relevance&type=video&q=${query}&key=${API_KEY}`;
          
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
          const generalApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&order=relevance&type=video&q=${generalQuery}&key=${API_KEY}`;
          
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

  

  const handleOpenInYouTube = () => {
    if (videoData) {
      window.open(`https://www.youtube.com/watch?v=${videoData.id.videoId}`, '_blank');
    }
  };

  if (!homeTeam || !awayTeam) {
    return null;
  }

  return (
    <Card className="w-full shadow-sm border border-gray-200">
      <CardHeader className="pb-4 pt-4 px-4">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
          <Play className="h-4 w-4 mr-2 text-red-600" />
          Official Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600 text-sm">Loading highlights...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center py-6 space-y-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <span className="text-sm text-gray-700">{error}</span>
            </div>
            <button
              onClick={searchForHighlights}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {videoData && (
          <div className="space-y-3">
            {/* Embedded Video Player - 365scores Style */}
            <div className="relative w-full bg-black rounded-sm overflow-hidden" style={{ paddingBottom: '55.9%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoData.id.videoId}?rel=0&modestbranding=1&enablejsapi=1`}
                title={videoData.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            
            {/* Video Info - Simplified */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 line-clamp-2 text-sm leading-tight">
                {videoData.snippet.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">{videoData.snippet.channelTitle}</span>
                <span>{formatPublishDate(videoData.snippet.publishedAt)}</span>
              </div>
              
              {/* Action Button - Simplified */}
              <div className="pt-1">
                <button
                  onClick={handleOpenInYouTube}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors font-medium"
                >
                  <ExternalLink className="h-3 w-3" />
                  Watch on YouTube
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && !videoData && (
          <div className="text-center py-8 text-gray-500 space-y-4">
            <Play className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No highlights available for this match</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${homeTeam} vs ${awayTeam} highlights`)}`, '_blank')}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors font-medium"
              >
                Search on YouTube
              </button>
              <button
                onClick={searchForHighlights}
                className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors font-medium"
              >
                Try Search Again
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
