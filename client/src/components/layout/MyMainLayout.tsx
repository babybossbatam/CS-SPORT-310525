
import React, { useState, useMemo, Suspense, lazy } from "react";

import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useTranslation } from "@/contexts/LanguageContext";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Lazy load heavy components with better fallbacks
const TodayMatchPageCard = lazy(
  () => import("@/components/matches/TodayMatchPageCard"),
);

// Memoized components to prevent unnecessary re-renders
const MemoizedHeader = React.memo(Header);
const MemoizedMyRightContent = React.memo(MyRightContent);

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
  
  // Only log in development mode to reduce console noise
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 [MyMainLayout] Translation language: ${translationLanguage}`);
  }

  // Optimized fixture filtering with early returns and reduced processing
  const filteredFixtures = useMemo(() => {
    // Return empty array immediately if no fixtures to avoid heavy processing
    if (!fixtures?.length) {
      return [];
    }

    // Skip filtering if date is invalid
    if (!selectedDate || selectedDate === 'undefined') {
      return [];
    }

    // Only process if we have a reasonable number of fixtures
    if (fixtures.length > 1000) {
      console.warn('🚨 [MyMainLayout] Too many fixtures, limiting processing');
      return fixtures.slice(0, 100); // Limit to first 100 fixtures for performance
    }

    try {
      const filtered = fixtures.filter((fixture) => {
        if (!fixture?.fixture?.date) return false;
        
        // Use simpler date comparison
        const fixtureDate = fixture.fixture.date.split("T")[0];
        return fixtureDate === selectedDate;
      });

      return filtered;
    } catch (error) {
      console.error('Error filtering fixtures:', error);
      return [];
    }
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
      <MemoizedHeader showTextOnMobile={true} />
      <div
        className={cn(
          "py-4 mobile-main-layout overflow-y-auto min-h-screen",
          isMobile ? "px-0" : "px-0",
        )}
        style={{
          marginLeft: isMobile ? "0" : "150px",
          marginRight: isMobile ? "0" : "150px",
          marginTop: isMobile ? "100px" : "80px",
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
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <TodayMatchPageCard
                    fixtures={filteredFixtures}
                    onMatchClick={handleMatchClick}
                    onMatchCardClick={handleMatchCardClick}
                  />
                </Suspense>
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
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <MemoizedMyRightContent />
                </Suspense>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyMainLayout;
