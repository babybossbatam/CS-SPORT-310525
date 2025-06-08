import React from "react";
import { CardHeader } from "@/components/ui/card";
import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";

interface TodayMatchByTimeProps {
  selectedDate?: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
}) => {
  // Use current date if selectedDate is not provided
  const currentDate = selectedDate || new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Popular Leagues by Time
      </CardHeader>

      {/* Use TodayPopularFootballLeaguesNew component to display actual match data */}
      <TodayPopularFootballLeaguesNew
        selectedDate={currentDate}
        timeFilterActive={timeFilterActive}
        liveFilterActive={liveFilterActive}
        showTop20={true}
      />
    </>
  );
};

export default TodayMatchByTime;