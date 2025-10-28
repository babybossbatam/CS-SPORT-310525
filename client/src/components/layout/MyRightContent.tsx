import React, { useState, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import PopularTeamsList from "@/components/teams/PopularTeamsList";

// Lazy load components to reduce initial bundle size
const MyHomeFeaturedMatchNew = lazy(
  () => import("@/components/matches/MyHomeFeaturedMatchNew"),
);
const HomeTopScorersList = lazy(
  () => import("@/components/leagues/HomeTopScorersList"),
);
const LeagueStandingsFilter = lazy(
  () => import("@/components/leagues/LeagueStandingsFilter"),
);
const MyAllLeague = lazy(() => import("@/components/matches/MyAllLeague"));
const MyMainLayoutRight = lazy(
  () => import("@/components/layout/MyMainLayoutRight"),
);
const MyInfo = lazy(() => import("@/components/info/MyInfo"));

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
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
    console.log(
      "🎯 [MyRightContent] Closing match details - triggering slide animation only",
    );
    setSelectedFixture(null);
  };

  return (
    <div
      className="h-full min-h-0 relative overflow-y-auto"
      style={{ maxHeight: "calc(200vh - 300px)" }}
    >
      {/* Main content - always rendered, keeps state active */}
      <div
        className={cn(
          "h-full min-h-0 space-y-2 pb-4 absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto",
          selectedFixture
            ? "z-0 transform translate-x-full pointer-events-none"
            : "z-10 transform translate-x-0",
        )}
        style={{ height: "auto", minHeight: "100%" }}
      >
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

        <Suspense fallback={<div />}>
          <LeagueStandingsFilter />
        </Suspense>

        <Suspense fallback={<div />}>
          <MyInfo />
        </Suspense>

        {/* Popular Leagues & Teams - Show immediately (dynamic data) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <PopularLeaguesList />
            <PopularTeamsList />
          </div>

          <Suspense fallback={<div />}>
            <MyAllLeague onMatchCardClick={handleMatchCardClick} />
          </Suspense>
        </div>
      </div>

      {/* Match details overlay - only loaded when needed */}
      {selectedFixture && (
        <div
          className={cn(
            "absolute inset-0 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
            selectedFixture
              ? "z-10 transform translate-x-0"
              : "z-0 transform translate-x-full pointer-events-none",
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
