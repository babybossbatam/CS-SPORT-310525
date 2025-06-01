import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandlers } from './lib/errorHandler.ts'

// Setup global error handlers
setupGlobalErrorHandlers();
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "next-themes";
import { initializeFlagCachePersistence } from "./lib/flagUtils";

// Initialize flag cache persistence
initializeFlagCachePersistence();

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);