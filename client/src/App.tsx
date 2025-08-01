import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { debugLogger } from "./lib/debugLogger";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import BrandedLoading from "@/components/common/BrandedLoading";

import React from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { setupGlobalErrorHandlers } from "./lib/errorHandler";
import { CentralDataProvider } from "./providers/CentralDataProvider";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Football = lazy(() => import("@/pages/Football"));
const Basketball = lazy(() => import("@/pages/Basketball"));
const HorseRacing = lazy(() => import("@/pages/HorseRacing"));
const Snooker = lazy(() => import("@/pages/Snooker"));
const Esport = lazy(() => import("@/pages/Esport"));
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
import Scores365Page from "./pages/Scores365Page";
import LiveScoreboardPage from "@/pages/LiveScoreboardPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/football" component={Football} />
      <Route path="/basketball" component={Basketball} />
      <Route path="/horseracing" component={HorseRacing} />
      <Route path="/snooker" component={Snooker} />
      <Route path="/esports" component={Esport} />

      <Route path="/login" component={() => <Authentication mode="login" />} />
      <Route
        path="/register"
        component={() => <Authentication mode="register" />}
      />
      <Route path="/match/:id" component={MatchDetails} />
      <Route path="/match/:id/:tab" component={MatchDetails} />
      <Route path="/league/:id" component={LeagueDetails} />
      <Route path="/league/:id/:tab" component={LeagueDetails} />
      <Route path="/live" component={LiveScoreboardPage} />
      <Route path="/my-scores" component={MyScores} />
      <Route path="/settings" component={Settings} />
      <Route path="/search" component={SearchResults} />
      <Route path="/live" component={LiveMatches} />
      <Route path="/news/:id" component={NewsPage} />
      <Route path="/scoreboard-demo" component={ScoreboardDemo} />
      <Route path="/365scores" component={Scores365Page} />
      <Route component={NotFound} />
    </Switch>
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
};

function AppContent() {
  try {
    return <Router />;
  } catch (error) {
    console.error("Router error:", error);
    return (
      <div>
        Router Error: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
}

function App() {
  // Initialize global error handlers
  React.useEffect(() => {
    setupGlobalErrorHandlers();

    // Add additional error handling for dynamic imports and runtime errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes(
          "Failed to fetch dynamically imported module",
        ) ||
        event.reason?.message?.includes("plugin:runtime-error-plugin") ||
        event.reason?.message?.includes("unknown runtime error") ||
        event.reason?.message?.includes("sendError") ||
        event.reason?.message?.includes("Too many re-renders") ||
        event.reason?.toString()?.includes("riker.replit.dev") ||
        event.reason?.toString()?.includes("plugin:runtime-error-plugin") ||
        (typeof event.reason === "string" &&
          event.reason.includes("plugin:runtime-error-plugin"))
      ) {
        console.log(
          "🔧 Runtime/dynamic import error caught and suppressed:",
          event.reason?.message || event.reason,
        );
        event.preventDefault();
        return;
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes("plugin:runtime-error-plugin") ||
        event.message?.includes("unknown runtime error") ||
        event.message?.includes("sendError") ||
        event.message?.includes("Too many re-renders") ||
        event.message?.includes("ErrorOverlay") ||
        event.message?.includes("reading 'frame'") ||
        event.filename?.includes("riker.replit.dev") ||
        event.error?.toString()?.includes("plugin:runtime-error-plugin") ||
        event.error?.toString()?.includes("ErrorOverlay")
      ) {
        console.log(
          "🔧 Runtime/ErrorOverlay error caught and suppressed:",
          event.message,
        );
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <main className="bg-stone-50 pt-[0px] pb-[0px] mt-[81px]">
        <QueryClientProvider client={queryClient}>
          <CentralDataProvider
            selectedDate={new Date().toISOString().slice(0, 10)}
          >
            <Provider store={store}>
              <Suspense
                fallback={
                  <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                    <BrandedLoading size="64px" className="py-8" />
                  </div>
                }
              >
                <AppContent />
              </Suspense>
            </Provider>
          </CentralDataProvider>
        </QueryClientProvider>
      </main>
    </TooltipProvider>
  );
}

export default App;
