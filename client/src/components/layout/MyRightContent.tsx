import React, { useState, useCallback, useRef, startTransition } from "react";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const { isMobile } = useDeviceInfo();
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMatchCardClick = useCallback((fixture: any) => {
    console.log("🎯 [MyRightContent] Match selected:", {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name,
    });

    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Start animation immediately
    setIsAnimating(true);

    // Use startTransition to mark state update as non-urgent
    startTransition(() => {
      setSelectedFixture(fixture);
    });

    // Reset animation state after animation completes
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match CSS transition duration
  }, []);

  const handleCloseDetails = useCallback(() => {
    console.log("🎯 [MyRightContent] Closing match details - triggering slide animation");
    
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Start animation immediately
    setIsAnimating(true);
    
    // Use startTransition to mark state update as non-urgent
    startTransition(() => {
      setSelectedFixture(null);
    });

    // Reset animation state after animation completes
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match CSS transition duration
  }, []);

  // Cleanup animation timeout on unmount
  React.useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full min-h-0 relative">
      {/* Main content - always rendered, keeps state active */}
      <div 
        className={cn(
          "h-full min-h-0 overflow-y-auto space-y-4 pb-4 absolute inset-0 transition-transform duration-300 ease-in-out",
          selectedFixture || isAnimating 
            ? "z-0 transform translate-x-full opacity-0 pointer-events-none" 
            : "z-10 transform translate-x-0 opacity-100"
        )}
        style={{
          // Force hardware acceleration
          willChange: 'transform, opacity',
          transform: selectedFixture || isAnimating ? 'translateX(100%)' : 'translateX(0)',
          opacity: selectedFixture || isAnimating ? 0 : 1,
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
        <div className="grid grid-cols-2 gap-4 ">
          <div className="space-y-4">
            <PopularLeaguesList />
            <PopularTeamsList />
          </div>
          <MyAllLeague onMatchCardClick={handleMatchCardClick} />
        </div>
      </div>

      {/* Match details overlay - always mounted, visibility controlled by CSS */}
      <div 
        className={cn(
          "absolute inset-0 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
          selectedFixture || isAnimating 
            ? "z-10 transform translate-x-0 opacity-100" 
            : "z-0 transform translate-x-full opacity-0 pointer-events-none"
        )}
        style={{
          // Force hardware acceleration
          willChange: 'transform, opacity',
          transform: selectedFixture || isAnimating ? 'translateX(0)' : 'translateX(100%)',
          opacity: selectedFixture || isAnimating ? 1 : 0,
        }}
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
