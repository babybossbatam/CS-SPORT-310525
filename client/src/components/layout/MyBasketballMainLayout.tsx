
import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyRightBasket from "@/components/layout/MyRightBasket";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useTranslation } from "@/contexts/LanguageContext";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Lazy load basketball-specific components
const MyLeftBasket = lazy(
  () => import("@/components/matches/MyLeftBasket"),
);

interface MyBasketballMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyBasketballMainLayout: React.FC<MyBasketballMainLayoutProps> = ({
  fixtures,
  loading = false,
  children,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const { isMobile } = useDeviceInfo();
  const { t, currentLanguage: translationLanguage } = useTranslation();
  
  console.log(`🌐 [MyBasketballMainLayout] Translation language: ${translationLanguage}`);

  // Apply smart time filtering to fixtures
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    console.log(
      `🔍 [MyBasketballMainLayout] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

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
                `❌ [MyBasketballMainLayout DATE FILTER] Excluding yesterday match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${fixtureDateString} < ${selectedDate})`,
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

        return shouldInclude;
      }

      return false;
    });

    console.log(
      `✅ [MyBasketballMainLayout] After smart filtering: ${filtered.length} matches for ${selectedDate}`,
    );

    return filtered;
  }, [fixtures, selectedDate]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [MyBasketballMainLayout] Match clicked from components:', {
      fixtureId: fixture?.fixture?.id,
      teams: `${fixture?.teams?.home?.name} vs ${fixture?.teams?.away?.name}`,
      league: fixture?.league?.name,
      status: fixture?.fixture?.status?.short,
      source: 'MyBasketballMainLayout'
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
    console.log('🎯 [MyBasketballMainLayout] Closing match details, returning to MyRightContent');
    setSelectedFixture(null);
  };

  return (
    <>
      <Header showTextOnMobile={true} />
      <div
        className={cn(
          "py-4 mobile-main-layout overflow-y-auto overflow-x-auto min-h-screen",
          isMobile ? "px-0" : "px-0",
        )}
        style={{
          marginLeft: isMobile ? "0" : "150px",
          marginRight: isMobile ? "0" : "150px",
          marginTop: isMobile ? "100px" : "80px",
          width: isMobile ? "100vw" : "auto",
          maxWidth: isMobile ? "100vw" : "none",
          minHeight: isMobile ? "calc(100vh - 100px)" : "calc(100vh - 80px)",
        }}
      >
        <div
          className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1 w-full" : "grid-cols-1 lg:grid-cols-12",
          )}
        >
          {/* Left column (5 columns on desktop, full width on mobile) */}
          <div
            className={cn(
              "space-y-4",
              isMobile ? "w-full col-span-1 px-0" : "lg:col-span-5",
            )}
          >
            {/* Basketball-specific MyLeftBasket */}
            <div className="max-h-full overflow-y-auto">
              <MyLeftBasket
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          </div>

          {/* Right column (7 columns) */}
          <div className={cn("space-y-4", "lg:col-span-7")}>
            {selectedFixture ? (
              <MyMainLayoutRight
                selectedFixture={selectedFixture}
                onClose={handleCloseDetails}
              />
            ) : (
              <MyRightBasket />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyBasketballMainLayout;
