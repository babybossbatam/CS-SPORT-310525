import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyScoresLeft from "@/components/matches/MyScoresLeft";
import MyRightContent, {
  MyRightDetails,
} from "@/components/layout/MyRightContent";
import MyScoresRight from "@/components/layout/MyScoresRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MyScoresMainProps {
  fixtures?: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyScoresMain: React.FC<MyScoresMainProps> = ({
  fixtures = [],
  loading = false,
  children,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const { isMobile } = useDeviceInfo();

  // Apply UTC date filtering to fixtures
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    console.log(
      `🔍 [MyScoresMain UTC] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

    // Use UTC dates throughout - no timezone conversion
    const todayUTC = new Date();
    const todayUTCString = todayUTC.toISOString().split("T")[0]; // YYYY-MM-DD in UTC

    const filtered = fixtures.filter((fixture) => {
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        // Extract UTC date from fixture date (no timezone conversion)
        const fixtureUTCDate = new Date(fixture.fixture.date);
        const fixtureDateString = fixtureUTCDate.toISOString().split("T")[0]; // YYYY-MM-DD in UTC

        // Simple UTC date matching
        const shouldInclude = fixtureDateString === selectedDate;

        if (!shouldInclude) {
          console.log(
            `❌ [MyScoresMain UTC FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
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
          `✅ [MyScoresMain UTC FILTER] Match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
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

    console.log(
      `✅ [MyScoresMain UTC] After UTC filtering: ${filtered.length} matches for ${selectedDate}`,
    );
    return filtered;
  }, [fixtures, selectedDate]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    setSelectedFixture(fixture);
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  return (
    <div
      className={cn(
        "bg-[#FDFBF7] rounded-lg mobile-main-layout",
        isMobile ? "mx-2 py-2" : "py-4",
      )}
      style={{
        marginLeft: isMobile ? "4px" : "150px",
        marginRight: isMobile ? "4px" : "150px",
        marginTop: isMobile ? "-20px" : "0",
        paddingBottom: isMobile ? "80px" : "16px", // Extra padding for mobile bottom nav
      }}
    >
      <div
        className={cn(
          "gap-4",
          isMobile ? "flex flex-col space-y-3" : "grid grid-cols-1 lg:grid-cols-12",
        )}
      >
        {/* Left column (5 columns) */}
        <div className={cn("space-y-4", isMobile ? "w-full" : "lg:col-span-5")}>
          {/* Render children if provided, otherwise show MyScoresCard and MyScoresLeft */}
          {children ? (
            <div className={isMobile ? "px-1" : ""}>{children}</div>
          ) : (
            <div className={isMobile ? "px-1" : ""}>
              <MyScoresLeft
                fixtures={filteredFixtures}
                onMatchClick={handleMatchClick}
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          )}
        </div>

        {/* Right column (7 columns) - Hidden on mobile when fixture is selected */}
        {!isMobile || !selectedFixture ? (
          <div
            className={cn(
              "space-y-4",
              isMobile ? "w-full px-1" : "lg:col-span-7",
            )}
          >
            {selectedFixture ? (
              <MyRightDetails
                selectedFixture={selectedFixture}
                onClose={handleBackToMain}
              />
            ) : (
              <MyScoresRight />
            )}
          </div>
        ) : null}

        {/* Mobile-only full-screen fixture details */}
        {isMobile && selectedFixture && (
          <div className="fixed inset-0 bg-[#FDFBF7] z-50 overflow-y-auto">
            <MyRightDetails
              selectedFixture={selectedFixture}
              onClose={handleBackToMain}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyScoresMain;
