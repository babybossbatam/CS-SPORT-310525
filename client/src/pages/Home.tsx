import React, { Suspense, lazy, useMemo, useCallback } from "react";
import { Trophy } from "lucide-react";
import BrandedLoading from "@/components/common/BrandedLoading";

// Lazy load heavy components
const Header = lazy(() => import("@/components/layout/Header"));
const SportsCategoryTabs = lazy(() => import("@/components/layout/SportsCategoryTabs"));
const TournamentHeader = lazy(() => import("@/components/layout/TournamentHeader"));
const MyMainLayout = lazy(() => import("@/components/layout/MyMainLayout"));
const Footer = lazy(() => import("@/components/layout/Footer"));
const RegionModal = lazy(() => import("@/components/modals/RegionModal"));

const Home = () => {
  // Memoize date calculation to prevent unnecessary re-calculations
  const selectedDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Memoize state to prevent unnecessary re-renders
  const [timeFilterActive, setTimeFilterActive] = React.useState(false);
  const [showTop20, setShowTop20] = React.useState(false);
  const [liveFilterActive, setLiveFilterActive] = React.useState(false);

  // Memoize callback to prevent child re-renders
  const handleMatchCardClick = useCallback((match: any) => {
    console.log("Match card clicked:", match);
  }, []);

  // Memoize tournament header props
  const tournamentHeaderProps = useMemo(() => ({
    title: "UEFA Champions League - Semi Finals",
    icon: <Trophy className="h-4 w-4 text-neutral-600" />
  }), []);

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<BrandedLoading />}>
        <Header />
      </Suspense>
      
      <Suspense fallback={<div className="h-12 bg-gray-50"></div>}>
        <SportsCategoryTabs />
      </Suspense>
      
      <Suspense fallback={<div className="h-16 bg-gray-100"></div>}>
        <TournamentHeader {...tournamentHeaderProps} />
      </Suspense>

      <div className="flex-1 h-full" style={{ marginTop: "52px", marginBottom: "-34px" }}>
        <Suspense fallback={<BrandedLoading />}>
          <MyMainLayout fixtures={[]} />
        </Suspense>
      </div>

      <div className="mt-10">
        <Suspense fallback={<div className="h-20 bg-gray-50"></div>}>
          <Footer />
        </Suspense>
      </div>
      
      <Suspense fallback={null}>
        <RegionModal />
      </Suspense>
    </div>
  );
};

export default Home;
