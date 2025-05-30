
interface DebugLogger {
  apiLog: (message: string) => void;
  matchFilterLog: (message: string) => void;
  cacheLog: (message: string) => void;
  errorLog: (message: string) => void;
  enableAll: () => void;
  disableAll: () => void;
  toggleApiLogs: (enabled: boolean) => void;
  toggleMatchFilterLogs: (enabled: boolean) => void;
  toggleCacheLogs: (enabled: boolean) => void;
  toggleErrorLogs: (enabled: boolean) => void;
}

class DebugLoggerImpl implements DebugLogger {
  private apiLogsEnabled = false;
  private matchFilterLogsEnabled = false;
  private cacheLogsEnabled = false;
  private errorLogsEnabled = false;

  apiLog(message: string) {
    // Completely disabled - no logging
  }

  matchFilterLog(message: string) {
    // Completely disabled - no logging
  }

  cacheLog(message: string) {
    // Completely disabled - no logging
  }

  errorLog(message: string) {
    // Completely disabled - no logging
  }

  enableAll() {
    // Disabled in production - no logging
  }

  disableAll() {
    this.apiLogsEnabled = false;
    this.matchFilterLogsEnabled = false;
    this.cacheLogsEnabled = false;
    this.errorLogsEnabled = false;
  }

  toggleApiLogs(enabled: boolean) {
    // Disabled in production - no logging
  }

  toggleMatchFilterLogs(enabled: boolean) {
    // Disabled in production - no logging
  }

  toggleCacheLogs(enabled: boolean) {
    // Disabled in production - no logging
  }

  toggleErrorLogs(enabled: boolean) {
    // Disabled in production - no logging
  }
}

// Create and export the debug logger instance
export const debugLogger = new DebugLoggerImpl();

// Ensure all debugging is disabled
debugLogger.disableAll();
