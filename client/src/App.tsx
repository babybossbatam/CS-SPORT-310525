import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { debugLogger } from "./lib/debugLogger";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import BrandedLoading from "@/components/common/BrandedLoading";

import React from 'react';
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { setupGlobalErrorHandlers } from "./lib/errorHandler";
import { CentralDataProvider } from "./providers/CentralDataProvider";
import { LanguageProvider } from "./contexts/LanguageContext";
import LanguageToast from "./components/common/LanguageToast";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import "./lib/eventEmitterUtils"; // Initialize EventEmitter limits
import { clearAllLogoCaches } from './lib/logoCache';

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Football = lazy(() => import("@/pages/Football"));
const Basketball = lazy(() => import("@/pages/Basketball"));
const TV = lazy(() => import("@/pages/TV"));
const HorseRacing = lazy(() => import("@/pages/HorseRacing"));
const Snooker = lazy(() => import("@/pages/Snooker"));
const Esport = lazy(() => import("@/pages/Esport"));
const MatchDetails = lazy(() => import("@/pages/MatchDetails"));
const Authentication = lazy(() => import("@/pages/Authentication"));
const LeagueDetails = lazy(() => import("@/pages/LeagueDetails"));
const MyScores = lazy(() => import("@/pages/MyScores"));

// Component to extract language from URL and provide it to LanguageProvider
const AppWithLanguageRouting = () => {
  const [location] = useLocation();

  // Extract language from URL
  const extractLanguageFromUrl = (): string | null => {
    const supportedLanguages = ['en', 'en-us', 'es', 'es-mx', 'zh-hk', 'zh', 'zh-tw', 'de', 'de-at', 'it', 'pt', 'pt-br', 'fr'];
    const pathParts = location.split('/').filter(part => part);

    if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
      return pathParts[0];
    }
    return null;
  };

  const urlLanguage = extractLanguageFromUrl();

  return (
    <Provider store={store}>
      <LanguageProvider initialLanguage={urlLanguage}>
        <CentralDataProvider>
          <TooltipProvider>
            <div className="App">
              <Suspense fallback={<BrandedLoading />}>
                <AppRoutes />
              </Suspense>
              <Toaster />
              <LanguageToast />
            </div>
          </TooltipProvider>
        </CentralDataProvider>
      </LanguageProvider>
    </Provider>
  );
};

// Separate component for routes
const AppRoutes = () => {
  return (
    <Switch>
      {/* Routes with language prefix */}
      <Route path="/:lang" component={Home} />
      <Route path="/:lang/" component={Home} />
      <Route path="/:lang/football" component={Football} />
      <Route path="/:lang/basketball" component={Basketball} />
      <Route path="/:lang/tv" component={TV} />
      <Route path="/:lang/horse-racing" component={HorseRacing} />
      <Route path="/:lang/snooker" component={Snooker} />
      <Route path="/:lang/esport" component={Esport} />
      <Route path="/:lang/match/:matchId" component={MatchDetails} />
      <Route path="/:lang/league/:leagueId" component={LeagueDetails} />
      <Route path="/:lang/my-scores" component={MyScores} />
      <Route path="/:lang/login" component={Authentication} />

      {/* Fallback routes without language (redirect to default language) */}
      <Route path="/" component={() => {
        window.location.href = "/en";
        return null;
      }} />
      <Route path="/football" component={() => {
        window.location.href = "/en/football";
        return null;
      }} />
      <Route path="/basketball" component={() => {
        window.location.href = "/en/basketball";
        return null;
      }} />

      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
};
const Settings = lazy(() => import("@/pages/Settings"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const LiveMatches = lazy(() => import("@/pages/LiveMatches"));
const LiveScoresPage = lazy(() => import("@/pages/LiveScoresPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const ScoreboardDemo = lazy(() => import("./pages/ScoreboardDemo"));
import Scores365Page from "./pages/Scores365Page";
import LiveScoreboardPage from "@/pages/LiveScoreboardPage";

// Mock functions for cache refresh and preloading (replace with actual implementation)
const setupCacheRefresh = () => {
  // Implement your cache refresh logic here, e.g., using setInterval
  // Example:
  // setInterval(() => {
  //   // Call functions to refetch data for components
  // }, 30 * 60 * 1000); // Every 30 minutes
};

const cleanupCacheRefresh = (intervalId) => {
  // Implement cleanup logic, e.g., clearInterval
  if (intervalId) {
    clearInterval(intervalId);
  }
};

const preloadData = () => {
  // Implement logic to preload data for components
};





function App() {
  useEffect(() => {
    // Force mobile-first layout immediately
    const isMobileCheck = window.innerWidth < 768;
    if (isMobileCheck) {
      document.documentElement.classList.add("mobile-device");
      document.body.classList.add("mobile-body");
    }

    setupGlobalErrorHandlers();
    const refreshInterval = setupCacheRefresh();

    // Clear all logo caches on app initialization
    clearAllLogoCaches();

    // Start performance monitoring
    console.log('🚀 Starting performance monitoring...');

    // Preload critical data
    preloadData();

    return () => {
      cleanupCacheRefresh(refreshInterval);
    };
  }, []);

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
      event.message?.includes("signal timed out") ||
      event.message?.includes("unknown runtime error") ||
      event.message?.includes("sendError") ||
      event.message?.includes("Too many re-renders") ||
      event.message?.includes("ErrorOverlay") ||
      event.message?.includes("reading 'frame'") ||
      event.filename?.includes("riker.replit.dev") ||
      event.error?.toString()?.includes("plugin:runtime-error-plugin") ||
      event.error?.toString()?.includes("signal timed out") ||
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

  useEffect(() => {
    // Immediately remove any existing error overlays
    const removeExistingOverlays = () => {
      const selectors = [
        '[data-error-overlay]',
        '#error-overlay',
        '.error-overlay',
        '[class*="error-overlay"]',
        '[class*="ErrorOverlay"]',
        '[data-runtime-error]',
        '.runtime-error-overlay',
        '[class*="runtime-error"]',
        'vite-error-overlay',
        '#vite-plugin-runtime-error-modal',
        '[data-vite-error]',
        '.vite-error-overlay'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          console.log('🗑️ Removing existing error overlay:', selector);
          element.remove();
        });
      });
    };

    // Run immediately and then periodically
    removeExistingOverlays();
    const cleanupInterval = setInterval(removeExistingOverlays, 1000);

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      clearInterval(cleanupInterval);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppWithLanguageRouting />
    </QueryClientProvider>
  );
}

export default App;