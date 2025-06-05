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
      alert(`Successfully recreated ${Object.keys(flags).length} flags! Check console for download instructions.`);
    } catch (error) {
      console.error('Failed to recreate flags:', error);
      alert('Failed to recreate flags. Check console for details.');
    }
  };

  // Function to download all generated flags
  const handleDownloadFlags = async () => {
    try {
      const { downloadAllGeneratedFlags } = await import('./lib/flagRecreation');
      downloadAllGeneratedFlags();
    } catch (error) {
      console.error('Failed to download flags:', error);
      alert('Failed to download flags. Check console for details.');
    }
  };

  // Function to force recreate all flags (including existing ones)
  const handleForceRecreateAll = async () => {
    try {
      // Clear existing generated flags first
      sessionStorage.removeItem('generatedFlags');
      
      const { extractColorsFromCachedFlag, generateCustomSVGFlag } = await import('./lib/flagRecreation');
      const { flagCache } = await import('./lib/logoCache');
      
      console.log('🔥 Force recreating ALL flags...');
      
      // Get all countries from cache
      const cache = (flagCache as any).cache;
      const allCountries: string[] = [];
      
      if (cache instanceof Map) {
        for (const [key] of cache.entries()) {
          if (key.startsWith('flag_')) {
            const country = key.replace('flag_', '').replace(/_/g, ' ');
            allCountries.push(country);
          }
        }
      }
      
      console.log(`🌍 Force generating ${allCountries.length} flag SVGs...`);
      
      let generated = 0;
      for (const country of allCountries) {
        try {
          const colors = await extractColorsFromCachedFlag(country);
          generateCustomSVGFlag(country, colors);
          generated++;
          
          if (generated % 10 === 0) {
            console.log(`📈 Generated ${generated}/${allCountries.length} flags...`);
          }
        } catch (error) {
          console.warn(`Failed to generate flag for ${country}:`, error);
        }
      }
      
      console.log(`✅ Force generated ${generated} flags for download!`);
      alert(`Force generated ${generated} flags! Now click "📥 Download Flags"`);
    } catch (error) {
      console.error('Failed to force recreate flags:', error);
      alert('Failed to force recreate flags. Check console for details.');
    }
  };

  // Function to clear generated flags
  const handleClearFlags = async () => {
    try {
      const { clearGeneratedFlags } = await import('./lib/flagRecreation');
      clearGeneratedFlags();
      alert('Cleared generated flags from storage');
    } catch (error) {
      console.error('Failed to clear flags:', error);
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <main className="bg-stone-50 pt-[0px] pb-[0px] mt-[130px] mb-[130px]">
        <div className="space-y-6">
          {/* Temporary flag management buttons - remove after testing */}
          <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            <button 
              onClick={handleFlagRecreation}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-600 text-sm"
            >
              🎨 Recreate Flags
            </button>
            <button 
              onClick={handleForceRecreateAll}
              className="bg-purple-500 text-white px-4 py-2 rounded shadow-lg hover:bg-purple-600 text-sm"
            >
              🔥 Force All Flags
            </button>
            <button 
              onClick={handleDownloadFlags}
              className="bg-green-500 text-white px-4 py-2 rounded shadow-lg hover:bg-green-600 text-sm"
            >
              📥 Download Flags
            </button>
            <button 
              onClick={handleClearFlags}
              className="bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600 text-sm"
            >
              🧹 Clear Cache
            </button>
          </div>
          <Router />
        </div>
      </main>
    </TooltipProvider>
  );
}

export default App;