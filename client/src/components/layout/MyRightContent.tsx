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
      "h-full min-h-0 overflow-y-auto pb-4",
      isMobile ? "space-y-2 px-2" : "space-y-4"
    )}>
      {/* Featured Match Section - Hidden on mobile */}
      {!isMobile && (
        <MyHomeFeaturedMatchNew selectedDate={selectedDate} maxMatches={8} />
      )}

     

      {/* Top Scorers - Mobile optimized */}
      <div className={cn(isMobile ? "mb-3" : "mb-4")}>
        <HomeTopScorersList />
      </div>

      {/* League Standings - Mobile optimized */}
      <div className={cn(isMobile ? "mb-3" : "mb-4")}>
        <LeagueStandingsFilter />
      </div>

      {/* CS SPORT Information Card - Mobile optimized */}
      <div className={cn(isMobile ? "mb-3" : "mb-4")}>
        <MyInfo />
      </div>

      {/* Popular Leagues and Teams sections - Mobile optimized */}
      <div className={cn(
        isMobile ? "flex flex-col space-y-3" : "grid grid-cols-2 gap-4"
      )}>
        <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
          <PopularLeaguesList />
          <PopularTeamsList />
        </div>
        <MyAllLeague />
      </div>

      {/* Mobile bottom padding for safe scrolling */}
      {isMobile && <div className="pb-safe-bottom h-4" />}
    </div>
  );
};

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };
