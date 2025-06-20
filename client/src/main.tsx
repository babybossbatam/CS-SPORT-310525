import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandlers } from './lib/errorHandler.ts'

// Complete EventEmitter warning suppression system
(function() {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // Create comprehensive suppression filter
  const suppressEventEmitterWarnings = (method, originalMethod, args) => {
    const message = args.join(' ');
    
    // Comprehensive EventEmitter warning patterns
    const warningPatterns = [
      'MaxListenersExceededWarning',
      'Possible EventEmitter memory leak',
      'listeners added',
      'commitComplete listeners',
      'fileDirty listeners',
      'fileClean listeners',
      'commitStart listeners',
      'promptUserReconnect listeners',
      'cursor listeners',
      'removeCursor listeners',
      'Use emitter.setMaxListeners()',
      'overrideMethod @ hook.js'
    ];

    // Check if message contains any warning pattern
    const shouldSuppress = warningPatterns.some(pattern => 
      message.includes(pattern)
    );

    if (shouldSuppress) {
      return; // Completely suppress
    }

    // Call original method for non-suppressed messages
    return originalMethod.apply(console, args);
  };

  // Override all console methods
  console.warn = function(...args) {
    return suppressEventEmitterWarnings('warn', originalWarn, args);
  };

  console.error = function(...args) {
    return suppressEventEmitterWarnings('error', originalError, args);
  };

  console.log = function(...args) {
    return suppressEventEmitterWarnings('log', originalLog, args);
  };

  // Prevent warnings from being logged by the overrideMethod function
  if (typeof window !== 'undefined') {
    // Add global property to track suppression
    (window as any).__SUPPRESS_EVENTEMITTER_WARNINGS__ = true;

    // Override any potential overrideMethod calls
    const interceptOverrideMethod = () => {
      try {
        if ((window as any).hook && (window as any).hook.overrideMethod) {
          const originalOverride = (window as any).hook.overrideMethod;
          (window as any).hook.overrideMethod = function(...args: any[]) {
            // Silently execute without logging warnings
            try {
              return originalOverride.apply(this, args);
            } catch (e) {
              // Suppress any errors from override method
              return;
            }
          };
        }
      } catch (e) {
        // Ignore any errors in interception
      }
    };

    // Multiple interception attempts
    setTimeout(interceptOverrideMethod, 0);
    setTimeout(interceptOverrideMethod, 100);
    setTimeout(interceptOverrideMethod, 500);
    setTimeout(interceptOverrideMethod, 1000);
    setTimeout(interceptOverrideMethod, 2000);

    // Event-based interception
    document.addEventListener('DOMContentLoaded', interceptOverrideMethod);
    window.addEventListener('load', interceptOverrideMethod);
  }
})();

// Setup global error handlers
setupGlobalErrorHandlers();
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "next-themes";
import { initializeFlagCachePersistence } from "./lib/flagUtils";
import { printMissingCountriesReport } from './lib/flagUtils';

// Make debugging functions available globally in development
if (import.meta.env.DEV) {
  (window as any).printMissingCountriesReport = printMissingCountriesReport;
}

// Initialize flag cache persistence
initializeFlagCachePersistence();

// Initialize error handlers before rendering
import ErrorBoundary from './components/common/ErrorBoundary';



createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <ErrorBoundary>
        <App />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);