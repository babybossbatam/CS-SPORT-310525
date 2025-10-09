import React, { useState, useMemo, Suspense, lazy, useEffect } from "react";
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

// Lazy load the TodayMatchPageCard component
const TodayMatchPageCard = lazy(
  () => import("@/components/matches/TodayMatchPageCard"),
);

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback;
    }

    return this.props.children;
  }
}


interface MyMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = React.memo(({
  fixtures = [],
  loading = false,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const { isMobile } = useDeviceInfo();
  const { t, currentLanguage: translationLanguage } = useTranslation();

  console.log(`🌐 [MyMainLayout] Translation language: ${translationLanguage}`);

  // Placeholder for currentDate, timeFilterActive, setTimeFilterActive, showTop20, setShowTop20, liveFilterActive, setLiveFilterActive
  // These should ideally be managed by a parent component or context if they are shared
  const currentDate = selectedDate; // Assuming selectedDate is what's used for current date display
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [showTop20, setShowTop20] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);

  // Prevent excessive re-renders and add error handling
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    if (renderCount > 10) {
      console.warn('MyMainLayout: Too many re-renders detected, potential infinite loop. Component will unmount.');
      // In a real app, you might want to handle this more gracefully, e.g., by showing an error message or resetting state.
      // For this example, we'll just log and let the component continue to prevent crashing.
    }
  }, [fixtures, selectedDate, user, currentFixture, selectedFixture, isMobile, translationLanguage, timeFilterActive, showTop20, liveFilterActive]); // Add dependencies

  // Early return with fallback UI if no fixtures and not loading
  if (!loading && (!fixtures || fixtures.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No matches today</h3>
          <p className="text-gray-600">Check back later for upcoming fixtures</p>
        </div>
      </div>
    );
  }

  // Simplified fixture filtering with error handling
  const filteredFixtures = useMemo(() => {
    try {
      if (!fixtures?.length || !selectedDate || selectedDate === 'undefined') {
        console.warn('🚨 [MyMainLayout] Invalid data:', { fixturesLength: fixtures?.length, selectedDate });
        return [];
      }

      console.log(`🔍 [MyMainLayout] Processing ${fixtures.length} fixtures for date: ${selectedDate}`);

      const filtered = fixtures.filter((fixture) => {
        try {
          if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
            return false;
          }

          // Extract UTC date from fixture date
          const fixtureUTCDate = new Date(fixture.fixture.date);
          if (isNaN(fixtureUTCDate.getTime())) {
            console.warn('Invalid fixture date:', fixture.fixture.date);
            return false;
          }

          const fixtureDateString = fixtureUTCDate.toISOString().split("T")[0];
          return fixtureDateString === selectedDate;
        } catch (error) {
          console.warn('Error filtering fixture:', error, fixture);
          return false;
        }
      });

      console.log(`✅ [MyMainLayout] Filtered to ${filtered.length} matches for ${selectedDate}`);
      return filtered;
    } catch (error) {
      console.error('Error in fixture filtering:', error);
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
              <div>
                {loading ? (
                  <Card className="h-[600px]">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {[...Array(8)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Suspense
                    fallback={
                      <Card className="h-[600px]">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    }
                  >
                    <ErrorBoundary
                      fallback={
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <h3 className="text-red-800 font-semibold">Error loading matches</h3>
                          <p className="text-red-600 text-sm mt-1">Please try refreshing the page</p>
                        </div>
                      }
                    >
                      <TodayMatchPageCard
                        fixtures={filteredFixtures}
                        onMatchClick={handleMatchClick}
                        onMatchCardClick={handleMatchCardClick}
                      />
                    </ErrorBoundary>
                  </Suspense>
                )}
              </div>
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
});

MyMainLayout.displayName = 'MyMainLayout';

export default MyMainLayout;