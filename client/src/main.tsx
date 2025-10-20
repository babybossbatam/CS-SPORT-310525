import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './lib/store'
import App from './App.tsx'
import './index.css'
import PerformanceMonitor from './components/common/PerformanceMonitor'
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
import './lib/memoryManager'
import './lib/workflowManager'
import { ResourceMonitor } from './lib/resourceMonitor'

// Defer resource monitoring initialization
requestIdleCallback(() => {
  ResourceMonitor.getInstance().init();
}, { timeout: 3000 });

// Initialize dark mode from localStorage (keep this immediate for UI)
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.documentElement.classList.add('dark');
}

// Defer console filtering to prevent blocking
if (import.meta.env.DEV) {
  requestIdleCallback(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('sandbox') ||
        message.includes('Unrecognized feature') ||
        message.includes('Allow attribute will take precedence')
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('sandbox') ||
        message.includes('Invalid or unexpected token') && message.includes('background.js')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    // Make debugging functions available
    (window as any).printMissingCountriesReport = printMissingCountriesReport;
  });
}

// Defer cache and storage initialization
requestIdleCallback(() => {
  initializeFlagCachePersistence();
  StorageMonitor.getInstance().init();
}, { timeout: 2000 });

// Set EventEmitter limits early for Replit environment
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(8000);
}

// Simple EventEmitter setup for Replit
if (typeof window !== 'undefined') {
  // Set reasonable limits for EventEmitters
  if ((window as any).EventEmitter) {
    (window as any).EventEmitter.defaultMaxListeners = 50;
  }

  if ((window as any).events?.EventEmitter) {
    (window as any).events.EventEmitter.defaultMaxListeners = 50;
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
            <PerformanceMonitor />
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);