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
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, RootState, userActions } from "@/lib/store";
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
      <AuthInitializer>
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
      </AuthInitializer>
    </Provider>
  );
};

// Auth initialization component to restore authentication state on app load
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check localStorage for persisted user data
        const savedUser = localStorage.getItem('cs_sport_user');
        const savedPreferences = localStorage.getItem('cs_sport_preferences');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('🔄 [Auth] Restoring user from localStorage:', userData.username);
          
          // Restore user data
          dispatch(userActions.setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email
          }));
          
          // Restore preferences if available
          if (savedPreferences) {
            const preferencesData = JSON.parse(savedPreferences);
            dispatch(userActions.setUserPreferences(preferencesData));
          } else {
            // Set default preferences
            dispatch(userActions.setUserPreferences({
              favoriteTeams: [],
              favoriteLeagues: [],
              favoriteMatches: [],
              region: 'global'
            }));
          }
          
          console.log('✅ [Auth] User authentication restored successfully');
        } else {
          console.log('🔐 [Auth] No saved user data found');
          dispatch(userActions.setAuthenticated(false));
        }
      } catch (error) {
        console.error('❌ [Auth] Failed to restore authentication:', error);
        dispatch(userActions.setAuthenticated(false));
      } finally {
        dispatch(userActions.setLoading(false));
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  if (!isInitialized) {
    return <BrandedLoading />;
  }

  return <>{children}</>;
};

// Protected Route Component
const ProtectedRoute = ({ component: Component, ...props }: any) => {
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
  const [location, navigate] = useLocation();
  
  // Extract language from current path
  const pathParts = location.split('/').filter(part => part);
  const currentLang = pathParts[0] || 'en';
  
  React.useEffect(() => {
    // Only redirect when loading is complete and user is not authenticated
    if (!isLoading && (!isAuthenticated || !user)) {
      const loginPath = `/${currentLang}/login`;
      console.log(`🔐 [Auth] User not authenticated, redirecting from ${location} to ${loginPath}`);
      navigate(loginPath, { replace: true });
    } else if (!isLoading && isAuthenticated && user) {
      console.log(`✅ [Auth] User ${user.username} is authenticated for route ${location}`);
    }
  }, [isLoading, isAuthenticated, user, location, navigate, currentLang]);
  
  // Show loading while checking authentication
  if (isLoading) {
    console.log('🔄 [Auth] Loading authentication state...');
    return <BrandedLoading />;
  }
  
  // If user is not authenticated, show loading (redirect is handled in useEffect)
  if (!isAuthenticated || !user) {
    console.log('🔐 [Auth] Not authenticated, showing loading...');
    return <BrandedLoading />;
  }
  
  console.log(`✅ [Auth] Rendering protected component for user: ${user.username}`);
  return <Component {...props} />;
};

// Separate component for routes
const AppRoutes = () => {
  return (
    <Switch>
      {/* Authentication routes (unprotected) */}
      <Route path="/:lang/login" component={Authentication} />
      
      {/* Protected routes with language prefix */}
      <Route path="/:lang" component={(props: any) => <ProtectedRoute component={Home} {...props} />} />
      <Route path="/:lang/" component={(props: any) => <ProtectedRoute component={Home} {...props} />} />
      <Route path="/:lang/football" component={(props: any) => <ProtectedRoute component={Football} {...props} />} />
      <Route path="/:lang/basketball" component={(props: any) => <ProtectedRoute component={Basketball} {...props} />} />
      <Route path="/:lang/tv" component={(props: any) => <ProtectedRoute component={TV} {...props} />} />
      <Route path="/:lang/horse-racing" component={(props: any) => <ProtectedRoute component={HorseRacing} {...props} />} />
      <Route path="/:lang/snooker" component={(props: any) => <ProtectedRoute component={Snooker} {...props} />} />
      <Route path="/:lang/esport" component={(props: any) => <ProtectedRoute component={Esport} {...props} />} />
      <Route path="/:lang/match/:matchId" component={(props: any) => <ProtectedRoute component={MatchDetails} {...props} />} />
      <Route path="/:lang/league/:leagueId" component={(props: any) => <ProtectedRoute component={LeagueDetails} {...props} />} />
      <Route path="/:lang/my-scores" component={(props: any) => <ProtectedRoute component={MyScores} {...props} />} />

      {/* Fallback routes without language (redirect to default language) */}
      <Route path="/" component={() => {
        const [, navigate] = useLocation();
        const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
        
        React.useEffect(() => {
          if (!isLoading) {
            const redirectPath = isAuthenticated ? "/en/football" : "/en/login";
            navigate(redirectPath, { replace: true });
          }
        }, [navigate, isAuthenticated, isLoading]);
        
        return <BrandedLoading />;
      }} />
      
      {/* Language-only routes (like /en) - redirect to appropriate page */}
      <Route path="/:lang" component={(props: any) => {
        const [, navigate] = useLocation();
        const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
        const lang = props.params.lang || 'en';
        
        React.useEffect(() => {
          if (!isLoading) {
            const redirectPath = isAuthenticated ? `/${lang}/football` : `/${lang}/login`;
            navigate(redirectPath, { replace: true });
          }
        }, [navigate, isAuthenticated, isLoading, lang]);
        
        return <BrandedLoading />;
      }} />
      
      <Route path="/football" component={() => {
        const [, navigate] = useLocation();
        const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
        
        React.useEffect(() => {
          if (!isLoading) {
            const redirectPath = isAuthenticated ? "/en/football" : "/en/login";
            navigate(redirectPath, { replace: true });
          }
        }, [navigate, isAuthenticated, isLoading]);
        
        return <BrandedLoading />;
      }} />
      <Route path="/basketball" component={() => {
        const [, navigate] = useLocation();
        const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
        
        React.useEffect(() => {
          if (!isLoading) {
            const redirectPath = isAuthenticated ? "/en/basketball" : "/en/login";
            navigate(redirectPath, { replace: true });
          }
        }, [navigate, isAuthenticated, isLoading]);
        
        return <BrandedLoading />;
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

    // Optimize performance for initial load
    if (typeof window !== 'undefined') {
      // Reduce initial bundle size impact
      requestIdleCallback(() => {
        preloadData();
      }, { timeout: 2000 });
      
      // Optimize font loading strategy
      const optimizeFontLoading = () => {
        // Create multiple font display elements to trigger immediate usage
        const triggerElements = [
          document.createElement('span'),
          document.createElement('div'),
          document.createElement('p')
        ];
        
        triggerElements.forEach((element, index) => {
          element.style.fontFamily = 'Inter, sans-serif';
          element.style.position = 'fixed';
          element.style.top = '-100px';
          element.style.left = '-100px';
          element.style.fontSize = '12px';
          element.style.visibility = 'hidden';
          element.style.pointerEvents = 'none';
          element.textContent = 'Inter font trigger';
          element.setAttribute('aria-hidden', 'true');
          
          document.body.appendChild(element);
          
          // Remove after font is registered
          setTimeout(() => {
            if (document.body.contains(element)) {
              document.body.removeChild(element);
            }
          }, 50 + (index * 10));
        });
      };

      // Preload font with immediate usage
      const fontPreload = document.createElement('link');
      fontPreload.rel = 'preload';
      fontPreload.href = '/fonts/Inter-Regular.woff2';
      fontPreload.as = 'font';
      fontPreload.type = 'font/woff2';
      fontPreload.crossOrigin = 'anonymous';
      
      fontPreload.onload = () => {
        // Immediate font usage
        optimizeFontLoading();
      };
      
      fontPreload.onerror = () => {
        console.log('🔧 Font preload failed, using fallback');
      };
      
      document.head.appendChild(fontPreload);
      
      // Also trigger font usage immediately for safety
      requestAnimationFrame(() => {
        optimizeFontLoading();
      });
    } else {
      preloadData();
    }

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