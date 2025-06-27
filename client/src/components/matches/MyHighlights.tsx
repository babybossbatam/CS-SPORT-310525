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

const MyHighlights: React.FC<MyHighlightsProps> = () => {
  return (
    <Card className="w-full h-500 shadow-sm border-gray-200">
      <CardHeader className="py-2 px-2">
        <CardTitle className="text-base font-md flex items-center text-sm text-gray-800">

          Official Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className=" py-0 px-0">
        {/* Highlights iframe widget */}
        <iframe
          src="https://feed.mikle.com/widget/v2/173779/?preloader-text=Loading&loading_spinner=off"
          height="100%"
          width="100%"
          className="fw-iframe"
          scrolling="no"
          frameBorder="0"
          title="Football Feed Widget"
        />
      </CardContent>
    </Card>
  );
};

export default MyHighlights;
