
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ExternalLink, Clock, Video } from 'lucide-react';

interface MyHighlightsProps {
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  matchStatus?: string;
  match?: any;
  matchId?: string;
}

interface HighlightVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  source: string;
  type: 'youtube' | 'vimeo' | 'direct';
}

const MyHighlights: React.FC<MyHighlightsProps> = ({
  homeTeam,
  awayTeam,
  leagueName,
  matchStatus = "NS",
  match,
  matchId
}) => {
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<HighlightVideo | null>(null);

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

  // Fetch video highlights
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setIsLoading(true);
        
        // Create sample highlights based on match data
        const sampleHighlights: HighlightVideo[] = [
          {
            id: 'highlight-1',
            title: `${teamData.home} vs ${teamData.away} - Match Highlights`,
            url: `https://www.youtube.com/embed/dQw4w9WgXcQ`, // Sample embed URL
            thumbnail: '/assets/no-live-matches.png',
            duration: '3:45',
            source: 'YouTube',
            type: 'youtube'
          },
          {
            id: 'highlight-2',
            title: `Best Goals - ${teamData.league}`,
            url: `https://www.youtube.com/embed/dQw4w9WgXcQ`,
            thumbnail: '/assets/no-live-matches.png',
            duration: '2:30',
            source: 'YouTube',
            type: 'youtube'
          },
          {
            id: 'highlight-3',
            title: `Key Moments - ${teamData.home} vs ${teamData.away}`,
            url: `https://www.youtube.com/embed/dQw4w9WgXcQ`,
            thumbnail: '/assets/no-live-matches.png',
            duration: '5:12',
            source: 'YouTube',
            type: 'youtube'
          }
        ];

        // If match is finished, show more highlights
        if (['FT', 'AET', 'PEN'].includes(teamData.status)) {
          setHighlights(sampleHighlights);
        } else if (['1H', '2H', 'LIVE', 'HT'].includes(teamData.status)) {
          // Live match - show live highlights or recent clips
          setHighlights([sampleHighlights[0]]);
        } else {
          // Upcoming match - show team previews
          setHighlights([
            {
              id: 'preview-1',
              title: `${teamData.home} - Team Preview`,
              url: `https://www.youtube.com/embed/dQw4w9WgXcQ`,
              thumbnail: '/assets/no-live-matches.png',
              duration: '4:20',
              source: 'YouTube',
              type: 'youtube'
            }
          ]);
        }
        
      } catch (error) {
        console.error('Error fetching highlights:', error);
        setHighlights([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamData.home && teamData.away) {
      fetchHighlights();
    } else {
      setIsLoading(false);
    }
  }, [teamData.home, teamData.away, teamData.status]);

  const playVideo = (video: HighlightVideo) => {
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  if (!teamData.home || !teamData.away) {
    return null;
  }

  return (
    <>
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base font-semibold flex items-center text-gray-800">
            <Video className="h-4 w-4 mr-2 text-red-500" />
            Match Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="relative w-full rounded-lg overflow-hidden bg-white shadow-xl">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading highlights...</p>
                </div>
              </div>
            )}
            
            <div className="max-h-96 overflow-y-auto">
              {highlights.length > 0 ? (
                <div className="space-y-3 p-4">
                  {/* Current match info */}
                  <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm text-blue-900">
                        🎯 Featured Match
                      </h4>
                      <span className="text-xs text-blue-600 font-medium">
                        {teamData.status}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 font-medium">
                      {teamData.home} vs {teamData.away}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {teamData.league}
                    </p>
                  </div>

                  {/* Video highlights */}
                  {highlights.map((video) => (
                    <div
                      key={video.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => playVideo(video)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/assets/no-live-matches.png';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-4 w-4 text-white bg-black bg-opacity-50 rounded-full p-1" />
                          </div>
                          <span className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {video.duration}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                            {video.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <Video className="h-3 w-3 mr-1" />
                            {video.source} • {video.duration}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full p-4 mb-4 inline-block">
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No Highlights Available
                  </h3>
                  <p className="text-gray-600">
                    Highlights will appear after the match
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center">
            <Clock className="h-3 w-3 mr-1" />
            Video Highlights • Updated after matches
          </div>
        </CardContent>
      </Card>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
              <button
                onClick={closeVideo}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={selectedVideo.url}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title={selectedVideo.title}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyHighlights;
