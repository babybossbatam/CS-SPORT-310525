
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ExternalLink } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const scriptLoadedRef = useRef(false);

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

  // Load ScoreBat script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const scriptId = 'scorebat-jssdk';
    const existingScript = document.getElementById(scriptId);
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.scorebat.com/embed/embed.js?v=arrv';
      script.async = true;
      script.onload = () => {
        setIsLoading(false);
        scriptLoadedRef.current = true;
      };
      script.onerror = () => {
        setEmbedError(true);
        setIsLoading(false);
      };
      
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    } else {
      setIsLoading(false);
      scriptLoadedRef.current = true;
    }
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setEmbedError(true);
    setIsLoading(false);
  };

  const openScoreBatExternal = () => {
    window.open('https://www.scorebat.com/', '_blank');
  };

  if (!teamData.home || !teamData.away) {
    return null;
  }

  // ScoreBat embed token
  const SCOREBAT_EMBED_TOKEN = 'MjExNjkxXzE3NTEwMDI4MzlfNzNkZmJkODBjMWNiZGFjZDhkMDNhNjM3OTI0MDA0ZGI0NjFkMDIwNw==';

  // If embed fails, show alternative content
  if (embedError) {
    return (
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base font-semibold flex items-center text-gray-800">
            <Play className="h-4 w-4 mr-2 text-red-500" />
            Match Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="relative w-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-xl">
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="bg-red-500 rounded-full p-4 mb-4">
                <Play className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {teamData.home} vs {teamData.away}
              </h3>
              <p className="text-gray-600 mb-4">
                Highlights available on ScoreBat
              </p>
              <button
                onClick={openScoreBatExternal}
                className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch on ScoreBat
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold flex items-center text-gray-800">
          <Play className="h-4 w-4 mr-2 text-red-500" />
          Football Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-xl">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading highlights...</p>
              </div>
            </div>
          )}
          <div className="w-full" style={{ height: '760px' }}>
            <iframe 
              src={`https://www.scorebat.com/embed/videofeed/?token=${SCOREBAT_EMBED_TOKEN}`}
              frameBorder="0" 
              width="100%" 
              height="760" 
              allowFullScreen 
              allow="autoplay; fullscreen" 
              style={{ 
                width: '100%', 
                height: '760px', 
                overflow: 'hidden', 
                display: 'block' 
              }} 
              className="_scorebatEmbeddedPlayer_"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`${teamData.home} vs ${teamData.away} - Football Highlights`}
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500 text-center">
          Powered by ScoreBat • {teamData.league}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
