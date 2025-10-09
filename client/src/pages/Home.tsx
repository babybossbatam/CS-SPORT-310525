import React, { useEffect, Suspense, lazy } from "react";
import Header from "@/components/layout/Header";
import MyMainLayout from "@/components/layout/MyMainLayout";
import BrandedLoading from "@/components/common/BrandedLoading";

// Lazy load non-critical components
const SportsCategoryTabs = lazy(() => import("@/components/layout/SportsCategoryTabs"));
const TournamentHeader = lazy(() => import("@/components/layout/TournamentHeader"));
const Footer = lazy(() => import("@/components/layout/Footer"));
const RegionModal = lazy(() => import("@/components/modals/RegionModal"));

const Home = () => {
  // Remove unused state variables that were causing unnecessary re-renders
  const [selectedDate] = React.useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Remove heavy preloading - let components load data as needed
  useEffect(() => {
    // Only preload essential data, not everything
    console.log('🏠 [Home] Component mounted, letting child components handle their own data');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <Suspense fallback={<div className="h-12" />}>
        <SportsCategoryTabs />
      </Suspense>
      
      <Suspense fallback={<div className="h-16" />}>
        <TournamentHeader
          title="Today's Matches"
          icon={<span className="text-sm">⚽</span>}
        />
      </Suspense>

      <div className="flex-1" style={{ marginTop: "52px" }}>
        {/* Pass empty fixtures array to prevent heavy initial data loading */}
        <MyMainLayout fixtures={[]} />
      </div>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      
      <Suspense fallback={null}>
        <RegionModal />
      </Suspense>
    </div>
  );
};

export default Home;
