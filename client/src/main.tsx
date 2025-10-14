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

// Simplified EventEmitter management
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(100);
}

// Simple console warning suppression for EventEmitter issues
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('MaxListenersExceededWarning')) {
      return; // Suppress EventEmitter warnings
    }
    originalConsoleWarn.apply(console, args);
  };
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