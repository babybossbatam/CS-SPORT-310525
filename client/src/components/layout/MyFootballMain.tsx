import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import TodayMatchPageCard from "@/components/matches/TodayMatchPageCard";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";
import MyHomeFeaturedMatchNew from "@/components/matches/MyHomeFeaturedMatchNew";
import HomeTopScorersList from "@/components/leagues/HomeTopScorersList";
import LeagueStandingsFilter from "@/components/leagues/LeagueStandingsFilter";
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import PopularTeamsList from "@/components/teams/PopularTeamsList";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMatchdetailsScoreboard from "../matches/MyMatchdetailsScoreboard";
import MatchDetailCard from "@/components/matches/MatchDetailCard";
import MyHighlights from "@/components/matches/MyHighlights";
import MyMatchEvents from "@/components/matches/MyMatchEvents";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useDeviceInfo, useMobileViewport } from "@/hooks/use-mobile";
import Header from "@/components/layout/Header";

import { Card, CardContent } from "@/components/ui/card";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight"; // Import MyMainLayoutRight

interface MyFootballMainProps {
  fixtures: any[];
}

const MyFootballMain: React.FC<MyFootballMainProps> = ({ fixtures }) => {
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  const { isMobile, isTablet, isPortrait } = useDeviceInfo();
  useMobileViewport();

  // OPTIMIZED: Apply smart time filtering with reduced processing overhead
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    // Further limit processing to prevent UI freeze - only process first 50 fixtures
    const fixturesSubset = fixtures.length > 50 ? fixtures.slice(0, 50) : fixtures;
    
    // Reduced logging frequency
    const shouldLog = fixtures.length > 50 && fixtures.length % 100 === 0;
    if (shouldLog) {
      console.log(`🔍 [MyFootballMain] Processing ${fixturesSubset.length}/${fixtures.length} fixtures for ${selectedDate}`);
    }

    // Determine what type of date is selected
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = format(tomorrow, "yyyy-MM-dd");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    const filtered = fixtures.filter((fixture) => {
      // Apply smart time filtering with selected date context
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z", // Pass selected date as context
        );

        // Check if this match should be included based on the selected date
        const shouldInclude = (() => {
          // For today's view, exclude any matches that are from previous days
          if (selectedDate === todayString) {
            if (smartResult.label === "today") return true;

            // Additional check: exclude matches from previous dates regardless of status
            const fixtureDate = new Date(fixture.fixture.date);
            const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");

            if (fixtureDateString < selectedDate) {
              console.log(
                `❌ [MyFootballMain DATE FILTER] Excluding yesterday match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${fixtureDateString} < ${selectedDate})`,
              );
              return false;
            }

            return false;
          }

          if (
            selectedDate === tomorrowString &&
            smartResult.label === "tomorrow"
          )
            return true;
          if (
            selectedDate === yesterdayString &&
            smartResult.label === "yesterday"
          )
            return true;

          // Handle custom dates
          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange)
              return true;
          }

          return false;
        })();

        if (!shouldInclude) {
          console.log(
            `❌ [MyFootballMain SMART FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureDate: fixture.fixture.date,
              status: fixture.fixture.status.short,
              reason: smartResult.reason,
              label: smartResult.label,
              selectedDate,
              isWithinTimeRange: smartResult.isWithinTimeRange,
            },
          );
          return false;
        }

        return true;
      }

      return false;
    });

    console.log(
      `✅ [MyFootballMain] After smart filtering: ${filtered.length} matches for ${selectedDate}`,
    );

    console.log(`📊 [MyFootballMain] Final selectedDateFixtures after filtering:`, {
      selectedDate,
      finalCount: filtered.length,
      filteredFixtures: filtered.slice(0, 5).map(f => ({
        id: f.fixture?.id,
        date: f.fixture?.date,
        teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
        status: f.fixture?.status?.short,
        league: f.league?.name,
        smartFilterReason: (() => {
          const smartResult = MySmartTimeFilter.getSmartTimeLabel(
            f.fixture.date,
            f.fixture.status.short,
            selectedDate + "T12:00:00Z"
          );
          return smartResult.reason;
        })()
      })),
      showingFirst: Math.min(5, filtered.length),
      totalFiltered: filtered.length
    });

    return filtered;
  }, [fixtures, selectedDate]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [MyFootballMain] Match clicked from components:', {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name,
      status: fixture?.fixture?.status?.short,
      source: 'MyFootballMain'
    });

    // Set the selected fixture to show MyMainLayoutRight
    setSelectedFixture(fixture);

    // Scroll to top when match is selected for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  const handleCloseDetails = () => {
    console.log('🎯 [MyFootballMain] Closing match details, returning to MyRightContent');
    setSelectedFixture(null);
  };

  return (
    <>
      <Header showTextOnMobile={true} />
      <div className={`
        ${isMobile ? 'px-2 py-2 pt-9' : 'py-4 pt-16'}
        ${isMobile ? 'mx-0' : ''}
        ${isTablet ? 'mx-4' : ''}
        ${!isMobile && !isTablet ? 'mx-[150px]' : ''}
        bg-[#FDFBF7] 
        ${isMobile ? 'rounded-none' : 'rounded-lg'}
        min-h-screen
        ${isMobile ? 'no-scroll-x' : ''}
        ${isMobile ? 'mb-16' : 'mb-24'}
      `}>
        <div className={`
          ${isMobile ? 'flex flex-col space-y-3' : 'grid grid-cols-1 lg:grid-cols-12 gap-4'}
        `}>
          {/* Left column (5 columns) - Main content on mobile */}
          <div className={`
            ${isMobile ? 'w-full' : 'lg:col-span-5'}
            ${isMobile ? 'space-y-2' : 'space-y-4'}
          `}>
            {/* Football-specific TodayMatchPageCard */}
            <div className={`
              ${isMobile ? 'mobile-scroll-y' : 'max-h-full overflow-y-auto'}
              ${isMobile ? 'min-h-[60vh]' : ''}
            `}>
              <TodayMatchPageCard
                fixtures={filteredFixtures}
                onMatchClick={handleMatchClick}
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          </div>

          {/* Right column (7 columns) - Hidden on mobile when fixture is selected */}
          {!isMobile && (
            <div className="lg:col-span-7 space-y-4">
              {selectedFixture ? (
                <>
                  <MyMainLayoutRight
                    selectedFixture={selectedFixture}
                    onClose={handleCloseDetails}
                  />

                  <MyMatchEvents
                    homeTeam={selectedFixture?.teams?.home?.name}
                    awayTeam={selectedFixture?.teams?.away?.name}
                    matchStatus={selectedFixture?.fixture?.status?.short}
                    match={selectedFixture}
                  />
                </>
              ) : (
                <MyRightContent />
              )}
            </div>
          )}
        </div>

        

        {/* Mobile: Show fixture details in overlay when selected */}
        {isMobile && selectedFixture && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <MyMainLayoutRight
              selectedFixture={selectedFixture}
              onClose={handleCloseDetails}
            />
            <MyMatchEvents
              homeTeam={selectedFixture?.teams?.home?.name}
              awayTeam={selectedFixture?.teams?.away?.name}
              matchStatus={selectedFixture?.fixture?.status?.short}
              match={selectedFixture}
            />
          </div>
        )}

        {/* Mobile bottom padding for safe area */}
        {isMobile && <div className="pb-safe-bottom" />}
      </div>
    </>
  );
};

export default MyFootballMain;