
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
  const [showVideo, setShowVideo] = useState(false);

  // YouTube API Configuration
  const API_KEY = 'AIzaSyA_hEdy01ChpBkp3MWKBmda6DsDDbcCw-o';
  const CHANNEL_ID = 'UCaopyJz-EIXOXYXSMOC6c-g';

  const searchForHighlights = async () => {
    if (!homeTeam || !awayTeam) {
      setError('Team names are required for highlights search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try to find live video
      const liveApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`;
      
      const liveResponse = await fetch(liveApiUrl);
      const liveData = await liveResponse.json();

      if (liveData.items && liveData.items.length > 0) {
        // Check if live video matches our teams
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

      // If no live video, search for highlights
      const query = encodeURIComponent(`${homeTeam} ${awayTeam} highlights ${leagueName || ''}`);
      const highlightApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=10&order=date&type=video&q=${query}&key=${API_KEY}`;
      
      const highlightResponse = await fetch(highlightApiUrl);
      const highlightData = await highlightResponse.json();

      if (highlightData.error) {
        throw new Error(highlightData.error.message);
      }

      if (highlightData.items && highlightData.items.length > 0) {
        // Find the best match by checking if both team names are in title
        const perfectMatch = highlightData.items.find((item: YouTubeVideo) => {
          const title = item.snippet.title.toLowerCase();
          return title.includes(homeTeam.toLowerCase()) && title.includes(awayTeam.toLowerCase());
        });

        if (perfectMatch) {
          setVideoData(perfectMatch);
        } else {
          // Fallback to first result
          setVideoData(highlightData.items[0]);
        }
      } else {
        setError('No highlight videos found for this match');
      }
    } catch (err) {
      console.error('Error fetching highlights:', err);
      setError('Failed to load highlight videos');
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

  const handlePlayVideo = () => {
    setShowVideo(true);
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
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center">
          <Play className="h-5 w-5 mr-2 text-red-500" />
          Match Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading highlights...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">{error}</span>
          </div>
        )}

        {videoData && !showVideo && (
          <div className="space-y-4">
            <div className="relative cursor-pointer group" onClick={handlePlayVideo}>
              <img 
                src={videoData.snippet.thumbnails.medium.url}
                alt={videoData.snippet.title}
                className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-16 w-16 text-white fill-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {videoData.snippet.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{videoData.snippet.channelTitle}</span>
                <span>{formatPublishDate(videoData.snippet.publishedAt)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handlePlayVideo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Watch Now
                </button>
                <button
                  onClick={handleOpenInYouTube}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  YouTube
                </button>
              </div>
            </div>
          </div>
        )}

        {videoData && showVideo && (
          <div className="space-y-4">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${videoData.id.videoId}?autoplay=1`}
                title={videoData.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowVideo(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to thumbnail
              </button>
              <button
                onClick={handleOpenInYouTube}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in YouTube
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && !videoData && (
          <div className="text-center p-8 text-gray-500">
            <Play className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No highlights available for this match</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
