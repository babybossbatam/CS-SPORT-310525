import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";

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
  homeTeamName,
  awayTeamName,
  leagueName,
  matchId
}) => {
  return (
    <Card className="w-full h-500 shadow-sm border-gray-200">
      <CardHeader className="py-2 px-2">
        <CardTitle className="text-base font-md flex items-center text-sm text-gray-800">
          {homeTeamName && awayTeamName 
            ? `${homeTeamName} vs ${awayTeamName} Highlights`
            : "Official Highlights"
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 px-0">
        {/* Highlights iframe widget */}
        <div className="w-full" style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
          <iframe
            src="https://feed.mikle.com/widget/v2/173779/?preloader-text=Loading&loading_spinner=off"
            width="100%"
            height="100%"
            className="fw-iframe"
            scrolling="no"
            frameBorder="0"
            title="Football Feed Widget"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
