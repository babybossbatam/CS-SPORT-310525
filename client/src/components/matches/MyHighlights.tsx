
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';

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
            <iframe 
              src="https://feed.mikle.com/widget/v2/173779/?preloader-text=Loading&loading_spinner=off" 
              height="359px" 
              width="100%" 
              className="fw-iframe" 
              scrolling="no" 
              frameBorder="0"
              title="Football Feed Widget"
            />
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
