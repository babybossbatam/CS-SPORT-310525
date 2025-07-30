import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import MyHomeFeaturedMatchNew from "@/components/matches/MyHomeFeaturedMatchNew";
import HomeTopScorersList from "@/components/leagues/HomeTopScorersList";
import LeagueStandingsFilter from "@/components/leagues/LeagueStandingsFilter";
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import MyAllLeague from "@/components/matches/MyAllLeague";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

import PopularTeamsList from "@/components/teams/PopularTeamsList";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  return (
    <>
      {/* New optimized featured match component for testing */}
      <MyHomeFeaturedMatchNew selectedDate={selectedDate} maxMatches={8} />

      <HomeTopScorersList />

      <LeagueStandingsFilter />

      {/* Popular Leagues and All League List sections */}
      <div className="grid grid-cols-2 grid-rows-1 gap-4">
        <PopularLeaguesList />

        <div className="h-full">
          <MyAllLeague />
        </div>
        <PopularTeamsList />
      </div>
    </>
  );
};

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };
