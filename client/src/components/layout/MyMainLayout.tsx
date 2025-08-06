import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Lazy load the TodayMatchPageCard component
const TodayMatchPageCard = lazy(
  () => import("@/components/matches/TodayMatchPageCard"),
);

interface MyMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
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

  // Optimized UTC date filtering with memoization
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    // Performance monitoring
    const startTime = performance.now();

    console.log(
      `🔍 [MyMainLayout UTC] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

    const filtered = fixtures.filter((fixture) => {
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        // Extract UTC date from fixture date (no timezone conversion)
        const fixtureUTCDate = new Date(fixture.fixture.date);
        const fixtureDateString = fixtureUTCDate.toISOString().split("T")[0]; // YYYY-MM-DD in UTC

        // Simple UTC date matching
        const shouldInclude = fixtureDateString === selectedDate;

        if (!shouldInclude) {
          console.log(
            `❌ [MyMainLayout UTC FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureUTCDate: fixture.fixture.date,
              extractedUTCDate: fixtureDateString,
              selectedDate,
              status: fixture.fixture.status.short,
              reason: "UTC date mismatch",
            },
          );
          return false;
        }

        console.log(
          `✅ [MyMainLayout UTC FILTER] Match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          {
            fixtureUTCDate: fixture.fixture.date,
            extractedUTCDate: fixtureDateString,
            selectedDate,
            status: fixture.fixture.status.short,
          },
        );

        return true;
      }

      return false;
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    if (processingTime > 50) {
      console.warn(
        `⚠️ [MyMainLayout Performance] Filtering took ${processingTime.toFixed(2)}ms`,
      );
    }

    console.log(
      `✅ [MyMainLayout UTC] After UTC filtering: ${filtered.length} matches for ${selectedDate} (${processingTime.toFixed(2)}ms)`,
    );
    return filtered;
  }, [fixtures, selectedDate]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    // On mobile and desktop, show match details in sidebar
    setSelectedFixture(fixture);
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  return (
    <>
      <Header showTextOnMobile={true} />
      <div
        className={cn(
          "  py-4 mobile-main-layout overflow-y-auto max-h-screen",
          isMobile ? "mx-2 mt-20" : "",
        )}
        style={{
          marginLeft: isMobile ? "8px" : "150px",
          marginRight: isMobile ? "8px" : "150px",
          marginTop: isMobile ? "-22px" : "0",
        }}
      >
        <div
          className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12",
          )}
        >
          {/* Left column (5 columns on desktop, full width on mobile) - Hide on mobile when match is selected */}
          {(!isMobile || !selectedFixture) && (
            <div
              className={cn(
                " space-y-4",
                isMobile ? "w-full col-span-1" : "lg:col-span-5",
              )}
            >
              {/* Render children if provided, otherwise show TodayMatchPageCard */}
              {children ? (
                <div>{children}</div>
              ) : (
                <div>
                  <TodayMatchPageCard
                    fixtures={filteredFixtures}
                    onMatchClick={handleMatchClick}
                    onMatchCardClick={handleMatchCardClick}
                  />
                </div>
              )}
            </div>
          )}

          {/* Right column (7 columns) - Show when match is selected on mobile, always show on desktop */}
          {(!isMobile || selectedFixture) && (
            <div
              className={cn(
                "space-y-4 ",
                isMobile ? "col-span-1" : "lg:col-span-7",
                isMobile && selectedFixture
                  ? "fixed inset-0 z-50 bg-white"
                  : "",
              )}
            >
              {selectedFixture ? (
                <MyMainLayoutRight
                  selectedFixture={selectedFixture}
                  onClose={handleBackToMain}
                />
              ) : (
                <MyRightContent />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyMainLayout;
