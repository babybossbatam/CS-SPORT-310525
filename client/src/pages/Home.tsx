import React from "react";
import Header from "@/components/layout/Header";
import SportsCategoryTabs from "@/components/layout/SportsCategoryTabs";
import TournamentHeader from "@/components/layout/TournamentHeader";
import MyMainLayout from "@/components/layout/MyMainLayout";
import Footer from "@/components/layout/Footer";
import RegionModal from "@/components/modals/RegionModal";
import { Trophy } from "lucide-react";
import TodayPopularFootballLeaguesNew from "@/components/matches/TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";

const Home = () => {
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [timeFilterActive, setTimeFilterActive] = React.useState(false);
  const [showTop20, setShowTop20] = React.useState(false);
  const [liveFilterActive, setLiveFilterActive] = React.useState(false);
  const [networkError, setNetworkError] = React.useState(false);

  // Global error handler for unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('🌐 [Home] Unhandled Promise Rejection:', event.reason);
      
      // Check if it's a network-related error
      if (event.reason?.message?.includes('Failed fetch') || 
          event.reason?.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
          event.reason?.message?.includes('net::ERR_')) {
        
        console.log('🌐 Network/import connectivity issue detected, attempting recovery...');
        setNetworkError(true);
        
        // Clear any stale cache data
        if (typeof window !== 'undefined' && window.localStorage) {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('logo') || key.includes('cache')) {
              localStorage.removeItem(key);
            }
          });
          console.log('🌐 Network recovery: Cleared stale cache data');
        }
        
        // Auto-recover after a short delay
        setTimeout(() => {
          setNetworkError(false);
          console.log('🌐 Network recovery: Resuming normal operation');
        }, 3000);
        
        // Prevent the error from propagating
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleMatchCardClick = (match: any) => {
    console.log("Match card clicked:", match);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader
        title="UEFA Champions League - Semi Finals"
        icon={<Trophy className="h-4 w-4 text-neutral-600" />}
      />

      <div className="flex-1" style={{ marginTop: "52px" }}>
        <MyMainLayout fixtures={[]} />
      </div>

      <Footer />
      <RegionModal />
    </div>
  );
};

export default Home;
