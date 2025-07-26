import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Clock, Calendar } from "lucide-react";
import { parseISO, isValid, format } from "date-fns";
import MyNewLeague2 from "./MyNewLeague2";

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive,
  liveFilterActive,
  onMatchCardClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!timeFilterActive) return null;

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader 
        className="cursor-pointer flex items-center justify-between p-3 bg-white border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-gray-800">Matches by Time</span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <MyNewLeague2
            selectedDate={selectedDate}
            onMatchCardClick={onMatchCardClick}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default TodayMatchByTime;