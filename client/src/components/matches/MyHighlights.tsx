
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

  useEffect(() => {
    // Load ScoreBat script and embed
    const loadScoreBatWidget = () => {
      // Create the iframe
      const iframe = document.createElement('iframe');
      iframe.src = "https://www.scorebat.com/embed/videofeed/?token=MjExNjkxXzE3NTEwMDc0NTFfMmY1ZGNjNWFiNDM1MjVmNWEwYjgyMDc3YjRlNjcyYWRmODI3MmM0Yw==";
      iframe.frameBorder = "0";
      iframe.width = "100%";
      iframe.height = "760";
      iframe.allowFullscreen = true;
      iframe.allow = 'autoplay; fullscreen';
      iframe.style.cssText = "width:100%;height:760px;overflow:hidden;display:block;";
      iframe.className = "_scorebatEmbeddedPlayer_";

      // Clear existing content and add iframe
      if (iframeContainerRef.current) {
        iframeContainerRef.current.innerHTML = '';
        iframeContainerRef.current.appendChild(iframe);
      }

      // Load ScoreBat script
      const existingScript = document.getElementById('scorebat-jssdk');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'scorebat-jssdk';
        script.src = 'https://www.scorebat.com/embed/embed.js?v=arrv';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Load widget on component mount
    const timer = setTimeout(loadScoreBatWidget, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

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
            <div className="flex items-center justify-center h-96 bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading video highlights...</p>
              </div>
            </div>
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
