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

// Minimal warning suppression for Replit environment
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('MaxListenersExceededWarning') || message.includes('sandbox')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Initialize flag cache persistence (lightweight)
initializeFlagCachePersistence();

// Lightweight EventEmitter setup
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(50); // Reduced from 100
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