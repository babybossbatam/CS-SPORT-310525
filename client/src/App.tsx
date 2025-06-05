import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { debugLogger } from "./lib/debugLogger";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Football = lazy(() => import("@/pages/Football"));
const Basketball = lazy(() => import("@/pages/Basketball"));
const Baseball = lazy(() => import("@/pages/Baseball"));
const Tennis = lazy(() => import("@/pages/Tennis"));
const Hockey = lazy(() => import("@/pages/Hockey"));
const MatchDetails = lazy(() => import("@/pages/MatchDetails"));
const Authentication = lazy(() => import("@/pages/Authentication"));
const LeagueDetails = lazy(() => import("@/pages/LeagueDetails"));
const MyScores = lazy(() => import("@/pages/MyScores"));
const Settings = lazy(() => import("@/pages/Settings"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const LiveMatches = lazy(() => import("@/pages/LiveMatches"));
const LiveScoresPage = lazy(() => import("@/pages/LiveScoresPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const ScoreboardDemo = lazy(() => import("./pages/ScoreboardDemo"));

// Import cache initialization
import { initializeFlagRecreation } from './lib/flagRecreation';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/" component={Home} />
      <Route path="/football" component={Football} />
      <Route path="/basketball" component={Basketball} />
      <Route path="/baseball" component={Baseball} />
      <Route path="/tennis" component={Tennis} />
      <Route path="/hockey" component={Hockey} />
      <Route path="/login" component={() => <Authentication mode="login" />} />
      <Route path="/register" component={() => <Authentication mode="register" />} />
      <Route path="/match/:id" component={MatchDetails} />
      <Route path="/match/:id/:tab" component={MatchDetails} />
      <Route path="/league/:id" component={LeagueDetails} />
      <Route path="/league/:id/:tab" component={LeagueDetails} />
      <Route path="/my-scores" component={MyScores} />
      <Route path="/settings" component={Settings} />
      <Route path="/search" component={SearchResults} />
      <Route path="/live" component={LiveMatches} />
      <Route path="/news/:id" component={NewsPage} />
      <Route path="/scoreboard-demo" component={ScoreboardDemo} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

// Mock functions for cache refresh and preloading (replace with actual implementation)
const setupCacheRefresh = () => {
  // Implement your cache refresh logic here, e.g., using setInterval
  // Example:
  // setInterval(() => {
  //   // Call functions to refetch data for components
  // }, 30 * 60 * 1000); // Every 30 minutes
};

const cleanupCacheRefresh = () => {
  // Implement cleanup logic, e.g., clearInterval
};

const preloadData = () => {
    // Implement logic to preload data for components
}


function App() {

  useEffect(() => {
    // Initialize cache refresh system
    setupCacheRefresh();

    // Preload critical data
    preloadData();

    // Initialize flag recreation system
    initializeFlagRecreation();

    // Cleanup on unmount
    return () => {
      cleanupCacheRefresh();
    };
  }, []);

  // Temporary function for manual flag recreation
  const handleFlagRecreation = async () => {
    try {
      const { recreateAllNationalTeamFlags } = await import('./lib/flagRecreation');
      const flags = await recreateAllNationalTeamFlags();
      console.log('🎨 Manually recreated flags:', Object.keys(flags).length);
      alert(`Successfully recreated ${Object.keys(flags).length} flags!`);
    } catch (error) {
      console.error('Failed to recreate flags:', error);
      alert('Failed to recreate flags. Check console for details.');
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <main className="bg-stone-50 pt-[0px] pb-[0px] mt-[130px] mb-[130px]">
        <div className="space-y-6">
          {/* Temporary flag recreation button - remove after testing */}
          <button 
            onClick={handleFlagRecreation}
            className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-600 z-50"
          >
            🎨 Recreate Flags
          </button>
          <Router />
        </div>
      </main>
    </TooltipProvider>
  );
}

export default App;