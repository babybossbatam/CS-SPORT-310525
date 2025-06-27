import React from 'react';
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

const MyHighlights: React.FC<MyHighlightsProps> = () => {
  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-semibold flex items-center text-gray-800">
          <Video className="h-4 w-4 mr-2 text-red-500" />
          Match Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Highlights iframe widget */}
        <div className="relative w-full rounded-lg overflow-hidden bg-white shadow-xl">
          <div 
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