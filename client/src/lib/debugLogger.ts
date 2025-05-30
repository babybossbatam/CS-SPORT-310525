
// Centralized debug logger utility
class DebugLogger {
  private apiLogsEnabled = false;
  private matchFilterLogsEnabled = false;
  private generalLogsEnabled = false;
  private allLogsEnabled = false;

  // API-related logging
  apiLog(...args: any[]) {
    if (this.apiLogsEnabled || this.allLogsEnabled) {
      console.log('[API]', ...args);
    }
  }

  apiWarn(...args: any[]) {
    if (this.apiLogsEnabled || this.allLogsEnabled) {
      console.warn('[API]', ...args);
    }
  }

  apiError(...args: any[]) {
    if (this.apiLogsEnabled || this.allLogsEnabled) {
      console.error('[API]', ...args);
    }
  }

  // Match filter logging
  matchFilterLog(...args: any[]) {
    if (this.matchFilterLogsEnabled || this.allLogsEnabled) {
      console.log('[MATCH_FILTER]', ...args);
    }
  }

  matchFilterWarn(...args: any[]) {
    if (this.matchFilterLogsEnabled || this.allLogsEnabled) {
      console.warn('[MATCH_FILTER]', ...args);
    }
  }

  // General logging
  log(...args: any[]) {
    if (this.generalLogsEnabled || this.allLogsEnabled) {
      console.log('[DEBUG]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.generalLogsEnabled || this.allLogsEnabled) {
      console.warn('[DEBUG]', ...args);
    }
  }

  error(...args: any[]) {
    if (this.generalLogsEnabled || this.allLogsEnabled) {
      console.error('[DEBUG]', ...args);
    }
  }

  // Toggle methods
  toggleApiLogs(enabled: boolean) {
    this.apiLogsEnabled = enabled;
  }

  toggleMatchFilterLogs(enabled: boolean) {
    this.matchFilterLogsEnabled = enabled;
  }

  toggleGeneralLogs(enabled: boolean) {
    this.generalLogsEnabled = enabled;
  }

  toggleAllLogs(enabled: boolean) {
    this.allLogsEnabled = enabled;
  }

  // Disable all debugging
  disableAll() {
    this.apiLogsEnabled = false;
    this.matchFilterLogsEnabled = false;
    this.generalLogsEnabled = false;
    this.allLogsEnabled = false;
  }

  // Enable all debugging
  enableAll() {
    this.allLogsEnabled = true;
  }

  // Get current status
  getStatus() {
    return {
      apiLogs: this.apiLogsEnabled,
      matchFilterLogs: this.matchFilterLogsEnabled,
      generalLogs: this.generalLogsEnabled,
      allLogs: this.allLogsEnabled
    };
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Disable all by default in production
if (import.meta.env.PROD) {
  debugLogger.disableAll();
}

// Export convenience functions
export const toggleApiLogs = (enabled: boolean) => debugLogger.toggleApiLogs(enabled);
export const toggleMatchFilterLogs = (enabled: boolean) => debugLogger.toggleMatchFilterLogs(enabled);
export const toggleGeneralLogs = (enabled: boolean) => debugLogger.toggleGeneralLogs(enabled);
export const toggleAllLogs = (enabled: boolean) => debugLogger.toggleAllLogs(enabled);
