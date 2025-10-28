
import React, { Suspense, lazy, useMemo, useCallback, useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import BrandedLoading from "@/components/common/BrandedLoading";

// Lazy load components with preload hints
const Header = lazy(() => import("@/components/layout/Header"));
const SportsCategoryTabs = lazy(() => import("@/components/layout/SportsCategoryTabs"));
const TournamentHeader = lazy(() => import("@/components/layout/TournamentHeader"));
const Footer = lazy(() => import("@/components/layout/Footer"));
const RegionModal = lazy(() => import("@/components/modals/RegionModal"));

// Lazy load main layout only when needed
const MyMainLayout = lazy(() => 
  import("@/components/layout/MyMainLayout").then(module => ({
    default: module.default
  }))
);

const Home = () => {
  const [isReady, setIsReady] = useState(false);
  
  // Memoize date calculation
  const selectedDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Delayed loading to prevent overwhelming
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Memoize tournament header props
  const tournamentHeaderProps = useMemo(() => ({
    title: "UEFA Champions League - Semi Finals",
    icon: <Trophy className="h-4 w-4 text-neutral-600" />
  }), []);

  // Simple loading fallback
  const SimpleLoading = () => (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<SimpleLoading />}>
        <Header />
      </Suspense>
      
      <Suspense fallback={<div className="h-12 bg-gray-50"></div>}>
        <SportsCategoryTabs />
      </Suspense>
      
      <Suspense fallback={<div className="h-16 bg-gray-100"></div>}>
        <TournamentHeader {...tournamentHeaderProps} />
      </Suspense>

      <div className="flex-1 h-full" style={{ marginTop: "52px", marginBottom: "-34px" }}>
        {isReady ? (
          <Suspense fallback={<BrandedLoading />}>
            <MyMainLayout fixtures={[]} />
          </Suspense>
        ) : (
          <SimpleLoading />
        )}
      </div>

      {/* Footer with minimal spacing */}
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
