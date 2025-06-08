
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";

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

      {/* Use TodayPopularFootballLeaguesNew component */}
      <TodayPopularFootballLeaguesNew
        selectedDate={currentDate}
        timeFilterActive={timeFilterActive}
        showTop20={timeFilterActive}
        liveFilterActive={liveFilterActive}
      />
    </>
  );
};

export default TodayMatchByTime;
