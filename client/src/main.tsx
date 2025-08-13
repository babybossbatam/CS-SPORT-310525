import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './lib/store'
import App from './App.tsx'
import './index.css'
import './lib/networkErrorHandler'
import { setupGlobalErrorHandlers } from './lib/errorHandler.ts'
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "next-themes";
import { initializeFlagCachePersistence } from "./lib/flagUtils";
import { printMissingCountriesReport } from './lib/flagUtils';
import { StorageMonitor } from './lib/storageMonitor';
import ErrorBoundary from './components/common/ErrorBoundary';

// Initialize dark mode from localStorage
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.documentElement.classList.add('dark');
}

// Filter out known Replit/browser warnings in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('sandbox') ||
      message.includes('Unrecognized feature') ||
      message.includes('Allow attribute will take precedence')
    ) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('sandbox') ||
      message.includes('Invalid or unexpected token') && message.includes('background.js')
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
}

// Make debugging functions available globally in development
if (import.meta.env.DEV) {
  (window as any).printMissingCountriesReport = printMissingCountriesReport;
}

// Initialize flag cache persistence
initializeFlagCachePersistence();

// Initialize storage monitoring
StorageMonitor.getInstance().init();

// Set EventEmitter limits early for Replit environment
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(8000);
}

// Set higher limits immediately for browser environment
if (typeof window !== 'undefined') {
  // Aggressively set limits before any other code runs
  const setLimitsImmediately = () => {
    // Set for common EventEmitter locations
    if ((window as any).EventEmitter) {
      (window as any).EventEmitter.defaultMaxListeners = 8000;
    }
    
    if ((window as any).events && (window as any).events.EventEmitter) {
      (window as any).events.EventEmitter.defaultMaxListeners = 8000;
    }

    // Target file watching specifically
    const fileWatchTargets = ['watchTextFile', 'changes', 'hook', 'textFile', 'fileWatcher'];
    fileWatchTargets.forEach(target => {
      if ((window as any)[target] && typeof (window as any)[target].setMaxListeners === 'function') {
        (window as any)[target].setMaxListeners(8000);
      }
    });
  };

  setLimitsImmediately();
  // Run again after a brief delay to catch any late-loading EventEmitters
  setTimeout(setLimitsImmediately, 100);
}

// Set default max listeners for EventEmitter globally
if (typeof window !== 'undefined') {
  // Try to set high limits on any existing EventEmitter classes
  try {
    if ((window as any).EventEmitter) {
      (window as any).EventEmitter.defaultMaxListeners = 2000;
    }
    
    // Set on global object if available
    if ((window as any).events && (window as any).events.EventEmitter) {
      (window as any).events.EventEmitter.defaultMaxListeners = 2000;
    }
  } catch (e) {
    // Ignore
  }
}

// Enhanced EventEmitter management for Replit
if (typeof window !== 'undefined') {
  // Suppress stallwart and fsError warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('MaxListenersExceededWarning') ||
      message.includes('fsError listeners') ||
      message.includes('stallwart') ||
      message.includes('failed ping') ||
      message.includes('changes listeners added') ||
      message.includes('watchTextFile') ||
      message.includes('Possible EventEmitter memory leak')
    ) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  // Handle Replit's file watching EventEmitter warnings
  if (typeof process !== 'undefined' && process.emitWarning) {
    const originalProcessEmitWarning = process.emitWarning;
    process.emitWarning = function(warning, type, code, ctor) {
      if (type === 'MaxListenersExceededWarning' && 
          (warning.toString().includes('changes listeners') || 
           warning.toString().includes('watchTextFile'))) {
        return; // Suppress Replit file watching warnings
      }
      return originalProcessEmitWarning.call(this, warning, type, code, ctor);
    };
  }
}

// Set EventEmitter default max listeners globally
if (typeof window !== 'undefined') {
  // Increase max listeners for browser environment
  (window as any).maxEventListeners = 100;
  
  // If EventEmitter is available globally, set its default
  if ((window as any).EventEmitter) {
    (window as any).EventEmitter.defaultMaxListeners = 100;
  }
}

// Setup global error handlers
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);