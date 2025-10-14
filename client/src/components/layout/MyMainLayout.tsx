import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useTranslation } from "@/contexts/LanguageContext";
import { CacheManager } from "@/lib/cachingHelper";

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
  const { t, currentLanguage: translationLanguage } = useTranslation();

  console.log(`🌐 [MyMainLayout] Translation language: ${translationLanguage}`);

  // Optimized fixture filtering with immediate cache check
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate || selectedDate === 'undefined') {
      // Try to get cached data immediately
      const cachedData = CacheManager.getCachedData([`fixtures-${selectedDate}`]);
      if (cachedData) {
        console.log(`⚡ [MyMainLayout] Using cached data for ${selectedDate}`);
        return cachedData;
      }
      console.warn('🚨 [MyMainLayout] Invalid data:', { fixturesLength: fixtures?.length, selectedDate });
      return [];
    }

    console.log(`🔍 [MyMainLayout] Processing ${fixtures.length} fixtures for date: ${selectedDate}`);

    const filtered = fixtures.filter((fixture) => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }

      // Extract UTC date from fixture date
      const fixtureUTCDate = new Date(fixture.fixture.date);
      const fixtureDateString = fixtureUTCDate.toISOString().split("T")[0];

      return fixtureDateString === selectedDate;
    });

    console.log(`✅ [MyMainLayout] Filtered to ${filtered.length} matches for ${selectedDate}`);

    // Cache the filtered results
    CacheManager.setCachedData([`fixtures-${selectedDate}`], filtered);

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
          style={{
            width: isMobile ? "100%" : "auto",
            minWidth: isMobile ? "100%" : "auto",
            padding: isMobile ? "0" : "auto",
          }}
        >
          {/* Left column (5 columns on desktop, full width on mobile) - Hide on mobile when match is selected */}
          {(!isMobile || !selectedFixture) && (
            <div
              className={cn(
                "space-y-4",
                isMobile ? "w-full col-span-1 px-0" : "lg:col-span-5",
              )}
              style={{
                width: isMobile ? "100%" : "auto",
                maxWidth: isMobile ? "100%" : "none",
              }}
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
                "space-y-4 h-full",
                isMobile ? "col-span-1" : "lg:col-span-7",
                isMobile && selectedFixture
                  ? "fixed inset-0 z-50 bg-white"
                  : "",
              )}
              style={{ height: isMobile && selectedFixture ? '100vh' : '100%' }}
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