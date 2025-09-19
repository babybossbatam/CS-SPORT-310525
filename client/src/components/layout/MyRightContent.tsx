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
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const { isMobile } = useDeviceInfo();

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [MyRightContent] Match selected:', {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name
    });
    setSelectedFixture(fixture);
  };

  const handleCloseDetails = () => {
    console.log('🎯 [MyRightContent] Closing match details');
    setSelectedFixture(null);
  };

  return (
    <div className="h-full min-h-0 relative">
      {/* Main content - always rendered, keeps state active at z-0 */}
      <div 
        className={cn(
          "h-full min-h-0 overflow-y-auto space-y-4 pb-4 absolute inset-0 z-0",
          selectedFixture ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {/* Featured Match Section - Hidden on mobile */}
        {!isMobile && (
          <MyHomeFeaturedMatchNew 
            selectedDate={selectedDate} 
            maxMatches={8}
            onMatchCardClick={handleMatchCardClick}
          />
        )}

        <HomeTopScorersList />

        <LeagueStandingsFilter />
        <MyInfo />
        {/* Popular Leagues and All League List sections */}
        <div className="grid grid-cols-2 gap-4 ">
          <div className="space-y-4">
            <PopularLeaguesList />
            <PopularTeamsList />
          </div>
          <MyAllLeague onMatchCardClick={handleMatchCardClick} />
        </div>

        
      </div>

      {/* Match details overlay - shown when fixture is selected at z-10 */}
      {selectedFixture && (
        <div className="absolute inset-0 z-10 bg-white dark:bg-gray-900 opacity-100">
          <MyMainLayoutRight
            selectedFixture={selectedFixture}
            onClose={handleCloseDetails}
          />
        </div>
      )}
    </div>
  );
};

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };