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
  type: 'youtube' | 'vimeo' | 'dailymotion' | 'scorebat' | 'feed';
  url?: string;
  embedUrl?: string;
  title?: string;
  error?: string;
}

const MyHighlights: React.FC<MyHighlightsProps> = ({ 
  homeTeam, 
  awayTeam, 
  leagueName, 
  match 
}) => {
  const uniqueId = useId();
  const [currentSource, setCurrentSource] = useState<VideoSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Extract team names from match prop or use provided props
  const home = homeTeam || match?.teams?.home?.name || 'Home Team';
  const away = awayTeam || match?.teams?.away?.name || 'Away Team';
  const league = leagueName || match?.league?.name || '';

  const searchQuery = `${home} vs ${away} highlights ${league}`.trim();

  const videoSources = [
    {
      name: 'YouTube',
      type: 'youtube' as const,
      searchFn: async () => {
        const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&maxResults=1&order=relevance`);
        const data = await response.json();
        
        if (data.error || data.quotaExceeded) {
          throw new Error(data.error || 'YouTube quota exceeded');
        }
        
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          return {
            name: 'YouTube',
            type: 'youtube' as const,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&rel=0`,
            title: video.snippet.title
          };
        }
        throw new Error('No YouTube videos found');
      }
    },
    {
      name: 'Vimeo',
      type: 'vimeo' as const,
      searchFn: async () => {
        const response = await fetch(`/api/vimeo/search?q=${encodeURIComponent(searchQuery)}&maxResults=1`);
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
        const response = await fetch(`/api/dailymotion/search?q=${encodeURIComponent(searchQuery)}&maxResults=1`);
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
    {
      name: 'ScoreBat',
      type: 'scorebat' as const,
      searchFn: async () => {
        const response = await fetch(`/api/highlights/search?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&league=${encodeURIComponent(league)}`);
        const data = await response.json();
        
        if (data.videoUrl) {
          return {
            name: 'ScoreBat',
            type: 'scorebat' as const,
            url: data.videoUrl,
            embedUrl: data.videoUrl,
            title: data.title || `${home} vs ${away} Highlights`
          };
        }
        throw new Error('No ScoreBat highlights found');
      }
    }
  ];

  const tryNextSource = async () => {
    if (sourceIndex >= videoSources.length) {
      // All sources failed, use ScoreBat embed as fallback
      const searchQuery = `${home} vs ${away}`.replace(/\s+/g, '-').toLowerCase();
      setCurrentSource({
        name: 'ScoreBat',
        type: 'scorebat',
        embedUrl: `https://www.scorebat.com/embed/g/${encodeURIComponent(searchQuery)}/`,
        title: `${home} vs ${away} Highlights`
      });
      setLoading(false);
      return;
    }

    const source = videoSources[sourceIndex];
    try {
      console.log(`🎬 [Highlights] Trying ${source.name} for: ${searchQuery}`);
      const result = await source.searchFn();
      setCurrentSource(result);
      setError(null);
      setLoading(false);
      console.log(`✅ [Highlights] Success with ${source.name}:`, result.title);
    } catch (sourceError) {
      console.warn(`❌ [Highlights] ${source.name} failed:`, sourceError);
      setSourceIndex(prev => prev + 1);
      // Continue to next source
    }
  };

  useEffect(() => {
    if (home && away) {
      setLoading(true);
      setError(null);
      setSourceIndex(0);
      tryNextSource();
    }
  }, [home, away, league]);

  useEffect(() => {
    if (sourceIndex > 0 && sourceIndex < videoSources.length) {
      tryNextSource();
    } else if (sourceIndex >= videoSources.length && loading) {
      tryNextSource();
    }
  }, [sourceIndex]);

  // Load ScoreBat script when using ScoreBat embed
  useEffect(() => {
    if (currentSource?.type === 'scorebat' && !loading) {
      const scriptId = 'scorebat-jssdk';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.scorebat.com/embed/embed.js?v=arrv';
        script.async = true;
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode?.insertBefore(script, firstScript);
      }
    }
  }, [currentSource, loading]);

  const handleRetry = () => {
    setSourceIndex(0);
    setError(null);
    setLoading(true);
    tryNextSource();
  };

  return (
    <Card className="w-full h-500 shadow-sm border-gray-200">
      <CardHeader className="py-2 px-2">
        <CardTitle className="text-base font-md flex items-center justify-between text-sm text-gray-800">
          <div className="flex items-center">
            <Video className="w-4 h-4 mr-2" />
            Official Highlights
          </div>
          {currentSource && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {currentSource.name}
            </span>
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
                {sourceIndex > 0 && (
                  <span className="block text-xs text-gray-400">
                    Trying {videoSources[sourceIndex]?.name || 'next source'}
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-gray-600 mb-2">Unable to load highlights</p>
              <button 
                onClick={handleRetry}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : currentSource ? (
          <div className="w-full" style={{ paddingBottom: currentSource.type === 'scorebat' ? '116%' : '56.25%', position: 'relative', height: 0 }}>
            <iframe
              key={`highlights-${uniqueId}-${currentSource.type}`}
              src={currentSource.embedUrl}
              width="100%"
              height={currentSource.type === 'scorebat' ? '650' : '100%'}
              className={currentSource.type === 'scorebat' ? '_scorebatEmbeddedPlayer_' : 'fw-iframe'}
              scrolling="no"
              frameBorder="0"
              title={currentSource.title || "Football Highlights"}
              allow={currentSource.type === 'scorebat' ? 'autoplay; fullscreen' : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'}
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: currentSource.type === 'scorebat' ? 'hidden' : 'visible'
              }}
              onError={() => {
                console.warn(`🎬 [Highlights] Iframe failed for ${currentSource.name}, trying next source`);
                setSourceIndex(prev => prev + 1);
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
        
        {currentSource && !loading && (
          <div className="p-2 bg-gray-50 border-t">
            <p className="text-xs text-gray-600 truncate" title={currentSource.title}>
              {currentSource.title}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
