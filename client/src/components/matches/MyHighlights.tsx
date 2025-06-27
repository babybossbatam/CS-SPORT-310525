import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play } from 'lucide-react';

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

  if (!teamData.home || !teamData.away) {
    return null;
  }

  // ScoreBat embed token
  const SCOREBAT_EMBED_TOKEN = 'MjExNjkxXzE3NTEwMDI4MzlfNzNkZmJkODBjMWNiZGFjZDhkMDNhNjM3OTI0MDA0ZGI0NjFkMDIwNw==';

  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold flex items-center text-gray-800">
          <Play className="h-4 w-4 mr-2 text-red-500" />
          Official Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-xl">
          <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <iframe 
              src={`https://www.scorebat.com/embed/videofeed/?token=${SCOREBAT_EMBED_TOKEN}`}
              frameBorder="0" 
              width="100%" 
              height="450" 
              allowFullScreen 
              allow="autoplay; fullscreen; picture-in-picture" 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', 
                height: '100%', 
                overflow: 'hidden', 
                display: 'block' 
              }} 
              className="_scorebatEmbeddedPlayer_"
              title={`${teamData.home} vs ${teamData.away} - Football Highlights`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHighlights;