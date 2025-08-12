import React, { useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useTranslation } from "@/contexts/LanguageContext";
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
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const { isMobile } = useDeviceInfo();
  const { t } = useTranslation();

  // Simple date filtering for fixtures
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate || selectedDate === 'undefined') {
      return [];
    }

    return fixtures.filter((fixture) => {
      if (fixture.fixture?.date && fixture.fixture?.status?.short) {
        const fixtureUTCDate = new Date(fixture.fixture.date);
        const fixtureDateString = fixtureUTCDate.toISOString().split("T")[0];
        return fixtureDateString === selectedDate;
      }
      return false;
    });
  }, [fixtures, selectedDate]);

  return (
    <>
      <Header showTextOnMobile={true} />
      <div
        className={cn(
          "py-4 mobile-main-layout overflow-y-auto",
          isMobile ? "mx-2" : "",
        )}
        style={{
          marginLeft: isMobile ? "8px" : "150px",
          marginRight: isMobile ? "8px" : "150px",
          marginTop: isMobile ? "60px" : "80px",
        }}
      >
        <div className="w-full">
          {/* Simple fixture display - shows all fixtures by country and league for selected date */}
          {children ? (
            <div>{children}</div>
          ) : (
            <Suspense fallback={<Skeleton className="w-full h-96" />}>
              <TodayMatchPageCard
                fixtures={filteredFixtures}
                onMatchClick={(matchId) => {
                  // Simple navigation to match details
                  window.location.href = `/match/${matchId}`;
                }}
                onMatchCardClick={() => {
                  // No sidebar functionality - keep it simple
                }}
              />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
};

export default MyMainLayout;
