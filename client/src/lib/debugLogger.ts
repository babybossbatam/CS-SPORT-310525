// Disable all debugging by default (both development and production)
debugLogger.disableAll();

// Only enable in development if explicitly requested
if (import.meta.env.DEV && localStorage.getItem('enableDebugLogs') === 'true') {
  debugLogger.enableAll();
}