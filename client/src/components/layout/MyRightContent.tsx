import React, { useState, useEffect, Suspense, lazy, memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { CacheManager } from "@/lib/cachingHelper";
// import MyHomeFeaturedMatchNew from "@/components/matches/MyHomeFeaturedMatchNew"; // Lazy loaded
// import HomeTopScorersList from "@/components/leagues/HomeTopScorersList"; // Lazy loaded
// import LeagueStandingsFilter from "@/components/leagues/LeagueStandingsFilter"; // Lazy loaded
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import MyAllLeague from "@/components/matches/MyAllLeague";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

// import PopularTeamsList from "@/components/teams/PopularTeamsList"; // Lazy loaded
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MyInfo from "@/components/info/MyInfo";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Lazy load heavy components
const MyHomeFeaturedMatchNew = lazy(() => import("@/components/matches/MyHomeFeaturedMatchNew"));
const HomeTopScorersList = lazy(() => import("@/components/leagues/HomeTopScorersList"));
const LeagueStandingsFilter = lazy(() => import("@/components/leagues/LeagueStandingsFilter"));
const PopularTeamsList = lazy(() => import("@/components/teams/PopularTeamsList"));

// Memoized fallback components
const FallbackSkeleton = memo(({ height = "h-32" }: { height?: string }) => (
  <div className={`${height} bg-gray-100 animate-pulse rounded-lg`} />
));

FallbackSkeleton.displayName = 'FallbackSkeleton';

const MyRightContent: React.FC = memo(() => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const [cachedData, setCachedData] = useState<any>(null);
  const { isMobile } = useDeviceInfo();

  // Load cached data immediately on mount with extended cache duration
  useEffect(() => {
    const cached = CacheManager.getCachedData([`right-content-${selectedDate}`]);
    if (cached) {
      console.log(`⚡ [MyRightContent] Loaded cached data for ${selectedDate}`);
      setCachedData(cached);
      
      // Cache non-live content for much longer (6 hours)
      CacheManager.setCachedData([`right-content-${selectedDate}`], cached, {
        maxAge: 6 * 60 * 60 * 1000, // 6 hours for non-live content
        priority: 'high'
      });
    }
  }, [selectedDate]);

  const handleMatchCardClick = useCallback((fixture: any) => {
    console.log("🎯 [MyRightContent] Match selected:", {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name,
    });
    setSelectedFixture(fixture);
  }, []);

  const handleCloseDetails = useCallback(() => {
    console.log("🎯 [MyRightContent] Closing match details - triggering slide animation only");
    // This triggers the CSS transform animation by changing the conditional class
    // Main content slides back in (translateX(0)) and detail view slides out (translateX(100%))
    // Similar to standings cache, we only clear the UI state, not the underlying data cache
    setSelectedFixture(null);
  }, []);

  return (
    <div className="h-full min-h-0 relative" style={{ height: '100vh', minHeight: '100vh' }}>
      {/* Main content - always rendered, keeps state active */}
      <div 
        className={useMemo(() => cn(
          "h-full min-h-0 space-y-2 pb-2 absolute inset-0 transition-transform duration-300 ease-in-out",
          selectedFixture ? "z-0 transform translate-x-full pointer-events-none" : "z-10 transform translate-x-0"
        ), [selectedFixture])}
        style={{ height: '100%', minHeight: '100%' }}
      >
        {/* Featured Match Section - Hidden on mobile */}
        {!isMobile && (
        <Suspense fallback={<FallbackSkeleton height="h-32" />}>
          <MyHomeFeaturedMatchNew
            selectedDate={selectedDate}
            maxMatches={6}
            onMatchCardClick={handleMatchCardClick}
          />
        </Suspense>
        )}

        <Suspense fallback={<FallbackSkeleton height="h-24" />}>
          <HomeTopScorersList />
        </Suspense>

        <Suspense fallback={<FallbackSkeleton height="h-24" />}>
          <LeagueStandingsFilter />
        </Suspense>
        <MyInfo />
        {/* Popular Leagues and All League List sections */}
        <div className="grid grid-cols-2 gap-4 ">
        <div className="space-y-4">
          <Suspense fallback={<FallbackSkeleton height="h-20" />}>
            <PopularLeaguesList />
          </Suspense>
          <Suspense fallback={<FallbackSkeleton height="h-20" />}>
            <PopularTeamsList />
          </Suspense>
        </div>
        <Suspense fallback={<FallbackSkeleton height="h-40" />}>
          <MyAllLeague onMatchCardClick={handleMatchCardClick} />
        </Suspense>

        </div>
      </div>

      {/* Match details overlay - always mounted, visibility controlled by CSS */}
      <div 
        className={useMemo(() => cn(
          "absolute inset-0 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
          selectedFixture ? "z-10 transform translate-x-0" : "z-0 transform translate-x-full pointer-events-none"
        ), [selectedFixture])}
      >
        <MyMainLayoutRight
          selectedFixture={selectedFixture}
          onClose={handleCloseDetails}
        />
      </div>
    </div>
  );
});

MyRightContent.displayName = 'MyRightContent';

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };