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
import MyInfo from "@/components/info/MyInfo";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const { isMobile } = useDeviceInfo();

  return (
    <div className={cn(
      "h-full min-h-0 overflow-y-auto",
      isMobile
        ? "space-y-3 py-2"
        : "space-y-4 pb-4"
    )}>
      {/* Featured Match Section - Hidden on mobile */}
      {!isMobile && (
        <MyHomeFeaturedMatchNew selectedDate={selectedDate} maxMatches={8} />
      )}

      {/* Top Scorers - Consistent spacing */}
      <div className={cn(
        isMobile
          ? "rounded-lg bg-white dark:bg-gray-800 shadow-sm mx-0"
          : ""
      )}>
        <HomeTopScorersList />
      </div>

      {/* League Standings - Consistent spacing */}
      <div className={cn(
        isMobile
          ? "rounded-lg bg-white dark:bg-gray-800 shadow-sm mx-0"
          : ""
      )}>
        <LeagueStandingsFilter />
      </div>

      {/* CS SPORT Information Card - Consistent spacing */}
      <div className={cn(
        isMobile
          ? "rounded-lg bg-white dark:bg-gray-800 shadow-sm mx-0"
          : ""
      )}>
        <MyInfo />
      </div>

      {/* Popular Leagues and Teams sections - Balanced mobile layout */}
      <div className={cn(
        isMobile
          ? "flex flex-col space-y-3"
          : "grid grid-cols-2 gap-4"
      )}>
        <div className="space-y-3">
          <div className={cn(
            isMobile
              ? "rounded-lg bg-white dark:bg-gray-800 shadow-sm mx-0"
              : ""
          )}>
            <PopularLeaguesList />
          </div>
          <div className={cn(
            isMobile
              ? "rounded-lg bg-white dark:bg-gray-800 shadow-sm mx-0"
              : ""
          )}>
            <PopularTeamsList />
          </div>
        </div>
        <div className={cn(
          isMobile
            ? "rounded-lg bg-white dark:bg-gray-800 shadow-sm mx-0"
            : ""
        )}>
          <MyAllLeague />
        </div>
      </div>

      {/* Mobile bottom safe area */}
      {isMobile && <div className="h-6" />}
    </div>
  );
};

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };