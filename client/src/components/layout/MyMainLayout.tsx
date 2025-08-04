import React, { useState, useMemo, Suspense, lazy, useRef, useEffect } from "react";
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

// Lazy load with preloading optimization
const TodayMatchPageCard = lazy(() => {
  // Preload the component module immediately
  const componentPromise = import("@/components/matches/TodayMatchPageCard");
  
  // Add a small delay to prevent blocking the main thread
  return new Promise(resolve => {
    componentPromise.then(module => {
      // Minimum 100ms delay to show skeleton briefly for UX
      setTimeout(() => resolve(module), 100);
    });
  });
});

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
  const [shouldLoadComponent, setShouldLoadComponent] = useState(false);
  const componentContainerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadComponent(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (componentContainerRef.current) {
      observer.observe(componentContainerRef.current);
    }

    // Fallback: load after 2 seconds anyway
    const timeout = setTimeout(() => {
      setShouldLoadComponent(true);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

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
      console.warn(`⚠️ [MyMainLayout Performance] Filtering took ${processingTime.toFixed(2)}ms`);
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
          "bg-[#FDFBF7] rounded-lg py-4 mobile-main-layout overflow-y-auto max-h-screen",
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
          <div className={cn("space-y-4", isMobile ? "w-full col-span-1" : "lg:col-span-5")}>
            {/* Render children if provided, otherwise show TodayMatchPageCard */}
            {children ? (
              <div>{children}</div>
            ) : (
              <div ref={componentContainerRef}>
                {shouldLoadComponent ? (
                  <Suspense fallback={
                    <div className="animate-in fade-in-50 duration-200">
                      <Card className="w-full">
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center gap-3 p-2 border rounded">
                                <Skeleton className="h-6 w-6 rounded" />
                                <Skeleton className="h-3 w-20" />
                                <div className="flex-1" />
                                <Skeleton className="h-3 w-12" />
                                <div className="flex-1" />
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-6 w-6 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  }>
                    <TodayMatchPageCard
                      fixtures={filteredFixtures}
                      onMatchClick={handleMatchClick}
                      onMatchCardClick={handleMatchCardClick}
                    />
                  </Suspense>
                ) : (
                  <div className="animate-pulse">
                    <Card className="w-full">
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-28" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center gap-3 p-2 border rounded">
                              <Skeleton className="h-6 w-6 rounded" />
                              <Skeleton className="h-3 w-20" />
                              <div className="flex-1" />
                              <Skeleton className="h-3 w-12" />
                              <div className="flex-1" />
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-6 w-6 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right column (7 columns) - Show when match is selected on mobile, always show on desktop */}
        {(!isMobile || selectedFixture) && (
          <div
            className={cn(
              "space-y-4",
              isMobile ? "col-span-1" : "lg:col-span-7",
              isMobile && selectedFixture ? "fixed inset-0 z-50 bg-white" : "",
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