import React, { useState, useEffect, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Lazy load heavy components to prevent simultaneous API calls
const MyHomeFeaturedMatchNew = lazy(() => import("@/components/matches/MyHomeFeaturedMatchNew"));
const HomeTopScorersList = lazy(() => import("@/components/leagues/HomeTopScorersList"));
const LeagueStandingsFilter = lazy(() => import("@/components/leagues/LeagueStandingsFilter"));
const PopularLeaguesList = lazy(() => import("@/components/leagues/PopularLeaguesList"));
const PopularTeamsList = lazy(() => import("@/components/teams/PopularTeamsList"));
const MyAllLeague = lazy(() => import("@/components/matches/MyAllLeague"));
const MyMainLayoutRight = lazy(() => import("@/components/layout/MyMainLayoutRight"));
const MyInfo = lazy(() => import("@/components/info/MyInfo"));

// Simple skeleton loader
const ComponentSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-4">
      <div className="flex items-center justify-center h-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
);

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const { isMobile } = useDeviceInfo();
  
  // Progressive loading states to prevent overwhelming the system
  const [loadPhase, setLoadPhase] = useState(0);
  
  useEffect(() => {
    // Phase 0: Initial render (nothing loaded yet)
    // Phase 1: Load critical components (Featured matches, Top scorers) after 500ms
    // Phase 2: Load secondary components (Standings, Popular leagues) after 1.5s
    // Phase 3: Load tertiary components (Teams, All leagues) after 3s
    
    const phase1Timer = setTimeout(() => setLoadPhase(1), 500);
    const phase2Timer = setTimeout(() => setLoadPhase(2), 1500);
    const phase3Timer = setTimeout(() => setLoadPhase(3), 3000);
    
    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
    };
  }, []);

  const handleMatchCardClick = (fixture: any) => {
    console.log("🎯 [MyRightContent] Match selected:", {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name,
    });
    setSelectedFixture(fixture);
  };

  const handleCloseDetails = () => {
    console.log("🎯 [MyRightContent] Closing match details - triggering slide animation only");
    setSelectedFixture(null);
  };

  return (
    <div className="h-full min-h-0 relative" style={{ height: '100vh', minHeight: '100vh' }}>
      {/* Main content - always rendered, keeps state active */}
      <div 
        className={cn(
          "h-full min-h-0 space-y-2 pb-2 absolute inset-0 transition-transform duration-300 ease-in-out",
          selectedFixture ? "z-0 transform translate-x-full pointer-events-none" : "z-10 transform translate-x-0"
        )}
        style={{ height: '100%', minHeight: '100%' }}
      >
        {/* Phase 1: Critical components - Featured Match & Top Scorers */}
        {loadPhase >= 1 ? (
          <>
            {/* Featured Match Section - Hidden on mobile */}
            {!isMobile && (
              <Suspense fallback={<ComponentSkeleton />}>
                <MyHomeFeaturedMatchNew
                  selectedDate={selectedDate}
                  maxMatches={12}
                  onMatchCardClick={handleMatchCardClick}
                />
              </Suspense>
            )}

            <Suspense fallback={<ComponentSkeleton />}>
              <HomeTopScorersList />
            </Suspense>
          </>
        ) : (
          <>
            {!isMobile && <ComponentSkeleton />}
            <ComponentSkeleton />
          </>
        )}

        {/* Phase 2: Secondary components - Standings & Info */}
        {loadPhase >= 2 ? (
          <>
            <Suspense fallback={<ComponentSkeleton />}>
              <LeagueStandingsFilter />
            </Suspense>
            <Suspense fallback={<div />}>
              <MyInfo />
            </Suspense>
          </>
        ) : (
          <>
            <ComponentSkeleton />
          </>
        )}

        {/* Phase 3: Tertiary components - Popular Leagues & Teams */}
        {loadPhase >= 3 ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Suspense fallback={<ComponentSkeleton />}>
                <PopularLeaguesList />
              </Suspense>
              <Suspense fallback={<ComponentSkeleton />}>
                <PopularTeamsList />
              </Suspense>
            </div>
            <Suspense fallback={<ComponentSkeleton />}>
              <MyAllLeague onMatchCardClick={handleMatchCardClick} />
            </Suspense>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <ComponentSkeleton />
              <ComponentSkeleton />
            </div>
            <ComponentSkeleton />
          </div>
        )}
      </div>

      {/* Match details overlay - only loaded when needed */}
      {selectedFixture && (
        <div 
          className={cn(
            "absolute inset-0 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
            selectedFixture ? "z-10 transform translate-x-0" : "z-0 transform translate-x-full pointer-events-none"
          )}
        >
          <Suspense fallback={<ComponentSkeleton />}>
            <MyMainLayoutRight
              selectedFixture={selectedFixture}
              onClose={handleCloseDetails}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default MyRightContent;
