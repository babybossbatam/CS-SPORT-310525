
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Play, ExternalLink } from 'lucide-react';

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

const MyHighlights: React.FC<MyHighlightsProps> = ({
  homeTeam,
  awayTeam,
  leagueName,
  matchStatus = "NS",
  match,
  matchId,
  homeTeamName,
  awayTeamName
}) => {
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [highlightsUrl, setHighlightsUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Extract team names from match object if available
  const getTeamNames = () => {
    if (match) {
      return {
        home: match.teams?.home?.name || homeTeam || homeTeamName,
        away: match.teams?.away?.name || awayTeam || awayTeamName,
        league: match.league?.name || leagueName,
        status: match.fixture?.status?.short || matchStatus,
        fixtureId: match.fixture?.id || matchId
      };
    }
    return {
      home: homeTeam || homeTeamName,
      away: awayTeam || awayTeamName,
      league: leagueName,
      status: matchStatus,
      fixtureId: matchId
    };
  };

  const teamData = getTeamNames();

  // Function to search for match highlights
  const searchForHighlights = async (homeTeam: string, awayTeam: string, league?: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Create search query
      const searchQuery = `${homeTeam} vs ${awayTeam} highlights ${league || ''}`.trim();
      console.log('🎬 [MyHighlights] Searching for highlights:', searchQuery);

      // For now, we'll use ScoreBat's embed approach with the actual match data
      // ScoreBat automatically finds highlights based on team names
      const scoreBatUrl = `https://www.scorebat.com/embed/g/${encodeURIComponent(searchQuery.replace(/\s+/g, '-').toLowerCase())}/`;
      
      // Try to get highlights from our backend first
      try {
        const response = await fetch(`/api/highlights/search?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&league=${encodeURIComponent(league || '')}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.videoUrl) {
            setHighlightsUrl(data.videoUrl);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.warn('🎬 [MyHighlights] API search failed, using fallback');
      }

      // Fallback to ScoreBat embed
      setHighlightsUrl(scoreBatUrl);
      setIsLoading(false);

    } catch (err) {
      console.error('🎬 [MyHighlights] Error searching for highlights:', err);
      setError('Unable to load highlights for this match');
      setIsLoading(false);
    }
  };

  // Search for highlights when component mounts or team data changes
  useEffect(() => {
    if (teamData.home && teamData.away) {
      searchForHighlights(teamData.home, teamData.away, teamData.league);
    } else {
      setIsLoading(false);
      setError('Team information not available');
    }
  }, [teamData.home, teamData.away, teamData.league, teamData.fixtureId]);

  // Don't render if no team data
  if (!teamData.home || !teamData.away) {
    return (
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base font-semibold flex items-center text-gray-800">
            <Video className="h-4 w-4 mr-2 text-red-500" />
            Match Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-center text-gray-500 py-8">
            <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No match data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold flex items-center text-gray-800">
          <Video className="h-4 w-4 mr-2 text-red-500" />
          Match Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
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
          {teamData.league && (
            <p className="text-xs text-blue-600 mt-1">
              {teamData.league}
            </p>
          )}
          {teamData.fixtureId && (
            <p className="text-xs text-gray-500 mt-1">
              Match ID: {teamData.fixtureId}
            </p>
          )}
        </div>

        {/* Highlights Content */}
        <div className="relative w-full rounded-lg overflow-hidden bg-white shadow-xl">
          <div 
            ref={iframeContainerRef}
            className="w-full"
            style={{ minHeight: '400px' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading highlights...</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Searching for {teamData.home} vs {teamData.away}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96 bg-gray-50">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">{error}</p>
                  <button
                    onClick={() => searchForHighlights(teamData.home, teamData.away, teamData.league)}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </div>
            ) : highlightsUrl ? (
              <iframe
                src={highlightsUrl}
                width="100%"
                height="400"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={`${teamData.home} vs ${teamData.away} Highlights`}
                className="w-full h-96"
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">No highlights available yet</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Highlights may become available after the match
                  </p>
                  <a
                    href={`https://www.scorebat.com/search/?q=${encodeURIComponent(teamData.home + ' vs ' + teamData.away)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-fit"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Search on ScoreBat
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center">
          <Video className="h-3 w-3 mr-1" />
          Powered by ScoreBat • Live Football Highlights
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
