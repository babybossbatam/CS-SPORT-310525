
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface TodayMatchByTimeProps {
  selectedDate?: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
  todayPopularFixtures?: any[];
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
  todayPopularFixtures = [],
}) => {
  // Use current date if selectedDate is not provided
  const currentDate = selectedDate || new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Popular Leagues by Time
      </CardHeader>

      {/* Empty Card */}
      <Card className="border bg-card text-card-foreground shadow-md overflow-hidden mb-4">
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
          <p className="text-xs text-gray-400 mt-2">
            Fixtures: {todayPopularFixtures.length} | Date: {currentDate}
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;
