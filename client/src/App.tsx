import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { debugLogger } from "./lib/debugLogger";

// Eagerly load critical components for faster initial load
import Home from "@/pages/Home";
import Football from "@/pages/Football";
import LiveMatches from "@/pages/LiveMatches";

// Lazy load less critical components with prefetch hints
const NotFound = lazy(() => import("@/pages/not-found"));
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
const LiveScoresPage = lazy(() => import("@/pages/LiveScoresPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const ScoreboardDemo = lazy(() => import("./pages/ScoreboardDemo"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-gray-600 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/football" component={Football} />
        <Route path="/live" component={LiveMatches} />
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
        <Route path="/news/:id" component={NewsPage} />
        <Route path="/scoreboard-demo" component={ScoreboardDemo} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// Optimized preloading strategy
const preloadComponents = () => {
  // Only preload on user interaction or when idle
  const preloadOnIdle = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import("@/pages/MatchDetails");
        import("@/pages/MyScores");
      });
    } else {
      setTimeout(() => {
        import("@/pages/MatchDetails");
        import("@/pages/MyScores");
      }, 3000);
    }
  };
  
  // Preload on first user interaction
  const preloadOnInteraction = () => {
    import("@/pages/Basketball");
    document.removeEventListener('mouseenter', preloadOnInteraction);
    document.removeEventListener('touchstart', preloadOnInteraction);
  };
  
  document.addEventListener('mouseenter', preloadOnInteraction, { once: true });
  document.addEventListener('touchstart', preloadOnInteraction, { once: true });
  preloadOnIdle();
};

const setupCacheRefresh = () => {
  // Setup cache refresh for fixture data every 30 minutes
  const interval = setInterval(() => {
    // Clear fixture cache to force fresh data
    if ('caches' in window) {
      caches.delete('fixtures-cache');
    }
  }, 30 * 60 * 1000);
  
  return interval;
};

const cleanupCacheRefresh = (interval: NodeJS.Timeout) => {
  if (interval) {
    clearInterval(interval);
  }
};

const preloadData = () => {
  // Minimal preloading - only when needed
  const preloadCriticalData = async () => {
    try {
      // Only preload the most critical data after initial render
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          fetch('/api/fixtures/live').catch(() => {}); // Silently fail
        });
      }
    } catch (error) {
      debugLogger.error('Failed to preload data:', error);
    }
  };
  
  // Minimal delay for critical render path
  setTimeout(preloadCriticalData, 2000);
}


function App() {
  useEffect(() => {
    // Initialize cache refresh system
    const cacheInterval = setupCacheRefresh();

    // Preload critical data and components
    preloadData();
    preloadComponents();

    // Cleanup on unmount
    return () => {
      cleanupCacheRefresh(cacheInterval);
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <main className="bg-stone-50 pt-[0px] pb-[0px] mt-[130px] mb-[130px]">
        <Router />
      </main>
    </TooltipProvider>
  );
}

export default App;