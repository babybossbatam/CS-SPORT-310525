import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';

interface MyHighlightsProps {
  homeTeam?: string;
  awayTeam?: string;
  leagueName?: string;
  matchStatus?: string;
  match?: any;
  matchId?: string;
}

const MyHighlights: React.FC<MyHighlightsProps> = ({
  homeTeam,
  awayTeam,
  leagueName,
  matchStatus = "NS",
  match,
  matchId
}) => {
  const iframeContainerRef = useRef<HTMLDivElement>(null);

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

  // YouTube test - no additional loading needed

  if (!teamData.home || !teamData.away) {
    return null;
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
          <p className="text-xs text-blue-600 mt-1">
            {teamData.league}
          </p>
        </div>

        {/* ScoreBat Video Feed Widget */}
        <div className="relative w-full rounded-lg overflow-hidden bg-white shadow-xl">
          <div 
            ref={iframeContainerRef}
            className="w-full"
            style={{ minHeight: '400px' }}
          >
            {/* Loading placeholder */}
            <iframe width="728" height="407" src="https://www.youtube.com/embed/ypVg9Iv_-vw" title="Juventus vs Manchester City (2-5) | Resumen | Highlights Mundial de Clubes FIFA 2025™" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
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