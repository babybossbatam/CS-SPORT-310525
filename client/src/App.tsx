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
import { Provider, useSelector } from "react-redux";
import { store, RootState } from "@/lib/store";
import { setupGlobalErrorHandlers } from "./lib/errorHandler";
import { CentralDataProvider } from "./providers/CentralDataProvider";
import { LanguageProvider } from "./contexts/LanguageContext";
import LanguageToast from "./components/common/LanguageToast";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import "./lib/eventEmitterUtils"; // Initialize EventEmitter limits
import { clearAllLogoCaches } from './lib/logoCache';
import { usePagePreload } from './hooks/usePagePreload';

// Preload critical pages
const Home = lazy(() => import(/* webpackChunkName: "home" */ "@/pages/Home"));
const Football = lazy(() => import(/* webpackChunkName: "football" */ "@/pages/Football"));

// Lazy load less critical pages
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ "@/pages/not-found"));
const Basketball = lazy(() => import(/* webpackChunkName: "basketball" */ "@/pages/Basketball"));
const TV = lazy(() => import(/* webpackChunkName: "tv" */ "@/pages/TV"));
const HorseRacing = lazy(() => import(/* webpackChunkName: "horse-racing" */ "@/pages/HorseRacing"));
const Snooker = lazy(() => import(/* webpackChunkName: "snooker" */ "@/pages/Snooker"));
const Esport = lazy(() => import(/* webpackChunkName: "esport" */ "@/pages/Esport"));
const MatchDetails = lazy(() => import(/* webpackChunkName: "match-details" */ "@/pages/MatchDetails"));
const Authentication = lazy(() => import(/* webpackChunkName: "auth" */ "@/pages/Authentication"));
const LeagueDetails = lazy(() => import(/* webpackChunkName: "league-details" */ "@/pages/LeagueDetails"));
const MyScores = lazy(() => import(/* webpackChunkName: "my-scores" */ "@/pages/MyScores"));

// Component to extract language from URL and provide it to LanguageProvider
const AppWithLanguageRouting = () => {
  const [location] = useLocation();
  const { prefetchPage } = usePagePreload();

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
    // Only essential initialization - defer everything else
    const isMobileCheck = window.innerWidth < 768;
    if (isMobileCheck) {
      document.documentElement.classList.add("mobile-device");
      document.body.classList.add("mobile-body");
    }

    // Defer heavy operations to prevent blocking
    const deferredInit = () => {
      setupGlobalErrorHandlers();
      
      // Delay cache operations to prevent initial blocking
      setTimeout(() => {
        clearAllLogoCaches();
        console.log('🚀 Performance monitoring started (deferred)');
      }, 1000);

      // Defer data preloading significantly
      if (typeof window !== 'undefined') {
        requestIdleCallback(() => {
          preloadData();
        }, { timeout: 5000 }); // Increased timeout
      }
    };

    // Use requestIdleCallback for all heavy initialization
    requestIdleCallback(deferredInit, { timeout: 2000 });

    // Simplified font loading - no immediate DOM manipulation
    if (typeof window !== 'undefined') {
      const fontPreload = document.createElement('link');
      fontPreload.rel = 'preload';
      fontPreload.href = '/fonts/Inter-Regular.woff2';
      fontPreload.as = 'font';
      fontPreload.type = 'font/woff2';
      fontPreload.crossOrigin = 'anonymous';
      document.head.appendChild(fontPreload);
    }

    // DISABLED: Cache cleanup interval causes continuous background processes that freeze Replit IDE
    // const cacheCleanupInterval = setInterval(() => {
    //   console.log('🧹 [Cache Cleanup] Running targeted cleanup...');
    //   // Only remove queries that are stale and inactive to avoid refetch storms
    //   queryClient.removeQueries({
    //     predicate: (query) => {
    //       const lastUpdated = query.state.dataUpdatedAt;
    //       const isStale = Date.now() - lastUpdated > 10 * 60 * 1000; // 10 minutes old
    //       const isInactive = query.getObserversCount() === 0; // No active subscribers
    //       return isStale && isInactive;
    //     }
    //   });
    //   clearAllLogoCaches();
    //   console.log('✅ [Cache Cleanup] Stale inactive queries removed');
    // }, 30 * 60 * 1000); // Every 30 minutes

    // No cleanup needed since intervals are disabled
    return () => {
      // Cleanup logic if needed in the future
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

    // Run immediately but DISABLE periodic removal to prevent continuous background process
    removeExistingOverlays();
    // DISABLED: This setInterval runs every 1 second and freezes Replit IDE
    // const cleanupInterval = setInterval(removeExistingOverlays, 1000);

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      // No interval to clear since it's disabled
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