import React, { useState, useMemo, Suspense, lazy, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useTranslation } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/enhancedApiWrapper";

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
  fixtures: initialFixtures,
  loading = false,
  children,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>(initialFixtures);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const { isMobile } = useDeviceInfo();
  const { t, currentLanguage: translationLanguage } = useTranslation();
  
  console.log(`🌐 [MyMainLayout] Translation language: ${translationLanguage}`);

  // Check if a match ended more than 2 hours ago (performance optimization like MyNewLeague2)
  const isMatchOldEnded = useCallback((fixture: any): boolean => {
    const status = fixture.fixture.status.short;
    const isEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status);

    if (!isEnded) return false;

    const matchDate = new Date(fixture.fixture.date);
    const hoursAgo = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);

    // Use 2-hour rule for better performance (same as MyNewLeague2)
    return hoursAgo > 2;
  }, []);

  // Cache key for ended matches
  const getCacheKey = useCallback((date: string) => {
    return `main_layout_ended_matches_${date}`;
  }, []);

  // Cache ended matches
  const cacheEndedMatches = useCallback((date: string, fixtures: any[]) => {
    try {
      const endedFixtures = fixtures.filter(isMatchOldEnded);

      if (endedFixtures.length === 0) return;

      const cacheKey = getCacheKey(date);
      const cacheData = {
        fixtures: endedFixtures,
        timestamp: Date.now(),
        date,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [MyMainLayout] Cached ${endedFixtures.length} ended matches for ${date}`);
    } catch (error) {
      console.error('Error caching ended matches:', error);
    }
  }, [getCacheKey, isMatchOldEnded]);

  // Fetch live data similar to MyNewLeague2
  const fetchLiveData = useCallback(async () => {
    try {
      setIsLoadingLive(true);
      console.log(`🔴 [MyMainLayout] Fetching live matches`);
      
      const response = await apiRequest("GET", "/api/fixtures/live");
      const liveData = await response.json();

      if (Array.isArray(liveData)) {
        console.log(`🔴 [MyMainLayout] Found ${liveData.length} live matches`);
        
        // Update fixtures with live data
        setFixtures(prevFixtures => {
          const updatedFixtures = [...prevFixtures];
          
          // Update existing fixtures with live data
          liveData.forEach(liveFixture => {
            const index = updatedFixtures.findIndex(f => f.fixture.id === liveFixture.fixture.id);
            if (index !== -1) {
              updatedFixtures[index] = liveFixture;
            } else {
              // Add new live fixture if not found
              const fixtureDate = new Date(liveFixture.fixture.date).toISOString().split("T")[0];
              if (fixtureDate === selectedDate) {
                updatedFixtures.push(liveFixture);
              }
            }
          });
          
          return updatedFixtures;
        });
      }
    } catch (error) {
      console.error(`❌ [MyMainLayout] Error fetching live data:`, error);
    } finally {
      setIsLoadingLive(false);
    }
  }, [selectedDate]);

  // Update live data periodically for live matches
  useEffect(() => {
    // Check if there are any live matches
    const hasLiveMatches = fixtures.some(fixture => 
      ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(fixture.fixture.status.short)
    );

    if (!hasLiveMatches) {
      console.log("🚫 [MyMainLayout] No live matches found, skipping live data updates");
      return;
    }

    // Fetch live data immediately
    fetchLiveData();

    // Set up interval for live updates (every 30 seconds like MyNewLeague2)
    const interval = setInterval(fetchLiveData, 30000);

    return () => clearInterval(interval);
  }, [fixtures, fetchLiveData]);

  // Cache ended matches when fixtures change
  useEffect(() => {
    if (selectedDate && fixtures.length > 0) {
      cacheEndedMatches(selectedDate, fixtures);
    }
  }, [fixtures, selectedDate, cacheEndedMatches]);

  // Optimized UTC date filtering with memoization (using enhanced fixtures state)
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate || selectedDate === 'undefined') {
      console.warn('🚨 [MyMainLayout] Invalid selectedDate:', selectedDate);
      return [];
    }

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
          "  py-4 mobile-main-layout overflow-y-auto ",
          isMobile ? "mx-2" : "",
        )}
        style={{
          marginLeft: isMobile ? "8px" : "150px",
          marginRight: isMobile ? "8px" : "150px",
          marginTop: isMobile ? "60px" : "80px",
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
                  {isLoadingLive && (
                    <div className="text-sm text-blue-600 mb-2 px-2">
                      🔴 Updating live matches...
                    </div>
                  )}
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
