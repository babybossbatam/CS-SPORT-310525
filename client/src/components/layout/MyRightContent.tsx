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
    console.log("🎯 [MyRightContent] Match selected:", {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name,
    });
    setSelectedFixture(fixture);
  };

  const handleCloseDetails = () => {
    console.log("🎯 [MyRightContent] Closing match details - triggering slide animation");
    // This triggers the CSS transform animation by changing the conditional class
    // Main content slides back in (translateX(0)) and detail view slides out (translateX(100%))
    setSelectedFixture(null);
  };

  return (
    <div className="h-full min-h-0 relative">
      {/* Main content - always rendered, keeps state active */}
      <div
        className={cn(
          "h-full min-h-0 overflow-y-auto space-y-4 pb-8 absolute inset-0 transition-transform duration-300 ease-in-out ",
          selectedFixture ? "z-0 transform translate-x-full pointer-events-none" : "z-10 transform translate-x-0"
        )}
        style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <PopularLeaguesList />
            <PopularTeamsList />
          </div>
          <div className="flex-1">
            <MyAllLeague onMatchCardClick={handleMatchCardClick} />
          </div>
        </div>

        {/* Extra bottom padding to ensure content isn't cut off */}
        <div className={cn(
          "h-20 pb-4",
          isMobile && "h-32 pb-safe-bottom"
        )} />
      </div>

      {/* Match details overlay - always mounted, visibility controlled by CSS */}
      <div
        className={cn(
          "absolute inset-0 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
          selectedFixture ? "z-10 transform translate-x-0" : "z-0 transform translate-x-full pointer-events-none"
        )}
      >
        <MyMainLayoutRight
          selectedFixture={selectedFixture}
          onClose={handleCloseDetails}
        />
      </div>
    </div>
  );
};

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };