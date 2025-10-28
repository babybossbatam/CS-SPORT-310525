import React, { useState, useEffect, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import PopularTeamsList from "@/components/teams/PopularTeamsList";

// Lazy load heavy components to prevent simultaneous API calls
const MyHomeFeaturedMatchNew = lazy(() => import("@/components/matches/MyHomeFeaturedMatchNew"));
const HomeTopScorersList = lazy(() => import("@/components/leagues/HomeTopScorersList"));
const LeagueStandingsFilter = lazy(() => import("@/components/leagues/LeagueStandingsFilter"));
const MyAllLeague = lazy(() => import("@/components/matches/MyAllLeague"));
const MyMainLayoutRight = lazy(() => import("@/components/layout/MyMainLayoutRight"));
const MyInfo = lazy(() => import("@/components/info/MyInfo"));

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const { isMobile } = useDeviceInfo();
  
  // Progressive loading states to prevent overwhelming the system
  const [loadPhase, setLoadPhase] = useState(0);
  
  // Intersection observer for scroll-based loading of heavy components
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });
  
  useEffect(() => {
    // Phase 0: Initial render (nothing loaded yet)
    // Phase 1: Load critical components (Featured matches, Top scorers) after 20s
    // Phase 2: Load secondary components (Standings, Info) after 40s
    // Phase 3: Load tertiary components (Popular Leagues, Teams, All Leagues) - scroll-based
    // AGGRESSIVE DELAYS to prevent Replit workspace resource exhaustion
    
    const phase1Timer = setTimeout(() => setLoadPhase(1), 20000);
    const phase2Timer = setTimeout(() => setLoadPhase(2), 40000);
    
    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
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
        {loadPhase >= 1 && (
          <>
            {/* Featured Match Section - Hidden on mobile */}
            {!isMobile && (
              <Suspense fallback={<div />}>
                <MyHomeFeaturedMatchNew
                  selectedDate={selectedDate}
                  maxMatches={12}
                  onMatchCardClick={handleMatchCardClick}
                />
              </Suspense>
            )}

            <Suspense fallback={<div />}>
              <HomeTopScorersList />
            </Suspense>
          </>
        )}

        {/* Phase 2: Secondary components - Standings & Info */}
        {loadPhase >= 2 && (
          <>
            <Suspense fallback={<div />}>
              <LeagueStandingsFilter />
            </Suspense>
            <Suspense fallback={<div />}>
              <MyInfo />
            </Suspense>
          </>
        )}

        {/* Popular Leagues & Teams - Show immediately (dynamic data) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <PopularLeaguesList />
            <PopularTeamsList />
          </div>
          
          {/* Phase 3: All Leagues - Load only when scrolled into view */}
          <div ref={targetRef}>
            {loadPhase >= 2 && isIntersecting && (
              <Suspense fallback={<div />}>
                <MyAllLeague onMatchCardClick={handleMatchCardClick} />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* Match details overlay - only loaded when needed */}
      {selectedFixture && (
        <div 
          className={cn(
            "absolute inset-0 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
            selectedFixture ? "z-10 transform translate-x-0" : "z-0 transform translate-x-full pointer-events-none"
          )}
        >
          <Suspense fallback={<div />}>
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
