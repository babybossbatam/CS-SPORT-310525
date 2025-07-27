import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/networkErrorHandler'

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
import { setupGlobalErrorHandlers } from './lib/errorHandler.ts'

// Set EventEmitter limits early
if (typeof process !== 'undefined') {
  process.setMaxListeners?.(50);
}

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

// Initial loader removed for faster page load

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