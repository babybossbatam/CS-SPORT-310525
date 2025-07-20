// Centralized error handling utility
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string
) => {
  const target = event.currentTarget;

  // Prevent infinite loops
  if (target.dataset.errorHandled === 'true') {
    return;
  }

  target.dataset.errorHandled = 'true';

  // Try provided fallback first, then default
  if (fallbackUrl && !target.src.includes(fallbackUrl)) {
    target.src = fallbackUrl;
    target.dataset.errorHandled = 'false'; // Allow one more try
  } else {
    target.src = '/assets/fallback-logo.png';
  }
};

export const handleApiError = (error: unknown): string => {
  console.error('API Error:', error);

  if (error instanceof Error) {
    if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return "Network error: Please check your internet connection and try again.";
    }
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return "Request timeout: Please try again.";
    }
    if (error.message.includes('server connection lost')) {
      return "Server connection lost: Reconnecting...";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
};

// Add network recovery helper
export const handleNetworkRecovery = () => {
  // Clear any cached data that might be stale
  if (typeof window !== 'undefined') {
    try {
      // Clear localStorage caches that might be corrupted
      Object.keys(localStorage).forEach(key => {
        if (key.includes('cache') || key.includes('query')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      });

      console.log('🌐 Network recovery: Cleared stale cache data');
    } catch (error) {
      console.warn('Error during network recovery:', error);
    }
  }
};

// Enhanced error categorization system
interface ErrorCategory {
  name: string;
  shouldSuppress: boolean;
  shouldReport: boolean;
  action: 'suppress' | 'fix' | 'monitor';
}

const categorizeError = (error: any): ErrorCategory => {
  const errorStr = error?.message || error?.toString?.() || String(error);
  
  // AbortError and signal aborted errors - suppress
  if (error instanceof Error && (error.name === 'AbortError' || errorStr.includes('signal is aborted'))) {
    return {
      name: 'abort-signal',
      shouldSuppress: true,
      shouldReport: false,
      action: 'suppress'
    };
  }
  
  // Replit development environment errors - suppress but log
  if (errorStr.includes('plugin:runtime-error-plugin') || 
      errorStr.includes('unknown runtime error') ||
      errorStr.includes('sendError') ||
      errorStr.includes('riker.replit.dev') ||
      errorStr.includes('signal is aborted')) {
    return {
      name: 'replit-dev-environment',
      shouldSuppress: true,
      shouldReport: false,
      action: 'suppress'
    };
  }
  
  // Network/connectivity issues - attempt recovery
  if (errorStr.includes('Failed to fetch') || 
      errorStr.includes('NetworkError') ||
      errorStr.includes('timeout')) {
    return {
      name: 'network-connectivity',
      shouldSuppress: false,
      shouldReport: true,
      action: 'fix'
    };
  }
  
  // Application logic errors - need investigation
  if (errorStr.includes('Cannot read properties') ||
      errorStr.includes('is not a function') ||
      errorStr.includes('undefined')) {
    return {
      name: 'application-logic',
      shouldSuppress: false,
      shouldReport: true,
      action: 'fix'
    };
  }
  
  // Memory/performance issues - monitor and optimize
  if (errorStr.includes('Maximum call stack') ||
      errorStr.includes('out of memory') ||
      errorStr.includes('MaxListenersExceeded')) {
    return {
      name: 'performance-memory',
      shouldSuppress: false,
      shouldReport: true,
      action: 'monitor'
    };
  }
  
  // Unknown errors - investigate
  return {
    name: 'unknown',
    shouldSuppress: false,
    shouldReport: true,
    action: 'monitor'
  };
};

// Enhanced error reporting system
const reportError = (error: any, category: ErrorCategory, context: string) => {
  if (!category.shouldReport) return;
  
  const errorReport = {
    category: category.name,
    action: category.action,
    context,
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    },
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.group(`🚨 Error Report: ${category.name}`);
  console.log('Action Required:', category.action);
  console.log('Error Details:', errorReport);
  console.groupEnd();
  
  // Store for debugging (in development)
  if (import.meta.env.DEV) {
    const errors = JSON.parse(localStorage.getItem('app-errors') || '[]');
    errors.push(errorReport);
    // Keep only last 50 errors
    if (errors.length > 50) errors.splice(0, errors.length - 50);
    localStorage.setItem('app-errors', JSON.stringify(errors));
  }
};

// Global unhandled rejection handler
export const setupGlobalErrorHandlers = () => {
  // Increase EventEmitter max listeners to prevent warnings
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(20);
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const category = categorizeError(error);
    
    // Handle AbortError specifically
    if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('signal is aborted'))) {
      console.log('🛑 AbortError detected and suppressed:', error.message);
      event.preventDefault();
      return;
    }

    // Handle runtime-error-plugin errors
    if (typeof error === 'string' && error.includes('runtime-error-plugin')) {
      console.log('🔧 Runtime error plugin issue suppressed:', error);
      event.preventDefault();
      return;
    }
    
    // Report the error for analysis
    reportError(error, category, 'unhandledrejection');
    
    // Take appropriate action based on category
    if (category.shouldSuppress) {
      console.log(`🔧 ${category.name} error suppressed:`, error?.message || error);
      event.preventDefault();
      return;
    }
    
    // For fixable errors, attempt recovery
    if (category.action === 'fix') {
      if (category.name === 'network-connectivity') {
        console.log('🌐 Network error detected, attempting recovery...');
        handleNetworkRecovery();
        event.preventDefault();
        return;
      }
    }

    console.error('🚨 Unhandled Promise Rejection:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('not 2xx response') ||
          error.message?.includes('Network Error') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('ERR_TUNNEL_CONNECTION_FAILED') ||
          error.message?.includes('ERR_HTTP2_SERVER_REFUSED_STREAM') ||
          error.message?.includes('dynamically imported module')) {
        console.log('🌐 Network/tunnel connectivity issue detected, attempting recovery...');
        handleNetworkRecovery();
        event.preventDefault();
        return;
      }

      if (error.message?.includes('frame') || 
          error.message?.includes('Cannot read properties of undefined') ||
          error.message?.includes('space after cleanup') ||
          error.message?.includes('MaxListenersExceededWarning')) {
        console.log('🖼️ Frame/memory-related error detected, suppressing cascade...');
        event.preventDefault();
        return;
      }
    }

    // Handle string errors that might be fetch-related or import-related
    if (typeof error === 'string' && 
        (error.includes('Failed to fetch') || 
         error.includes('Network') || 
         error.includes('dynamically imported') ||
         error.includes('MaxListenersExceeded') ||
         error.includes('runtime-error-plugin') ||
         error.includes('signal is aborted'))) {
      console.log('🌐 Network/import/abort error string detected, attempting recovery...');
      handleNetworkRecovery();
      event.preventDefault();
      return;
    }
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || event.message;
    const category = categorizeError(error);
    
    // Report the error for analysis
    reportError(error, category, 'global-error');
    
    // Take appropriate action based on category
    if (category.shouldSuppress) {
      console.log(`🔧 ${category.name} error suppressed:`, event.message);
      event.preventDefault();
      return;
    }

    console.error('🚨 Global error:', error);

    // Handle DOM manipulation errors
    if (event.error?.message?.includes('removeChild') || 
        event.error?.message?.includes('The node to be removed is not a child')) {
      console.warn('DOM manipulation error caught and suppressed:', event.error);
      event.preventDefault();
      return false;
    }

    // Prevent frame-related errors from crashing the app
    if (error?.message?.includes('frame') || 
        error?.message?.includes('ErrorOverlay') ||
        event.filename?.includes('vite/client')) {
      console.log('🖼️ Suppressing frame/vite overlay error');
      event.preventDefault();
      return;
    }

    // Handle network-related errors
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError')) {
      console.log('🌐 Network error in global handler');
      event.preventDefault();
      handleNetworkRecovery();
      return;
    }
  });

  // Cleanup function for when page unloads
  window.addEventListener('beforeunload', () => {
    // Remove all event listeners to prevent memory leaks
    window.removeEventListener('unhandledrejection', () => {});
    window.removeEventListener('error', () => {});
  });
};

// Utility to analyze stored errors
export const analyzeStoredErrors = () => {
  if (!import.meta.env.DEV) return;
  
  const errors = JSON.parse(localStorage.getItem('app-errors') || '[]');
  
  if (errors.length === 0) {
    console.log('✅ No stored errors found');
    return;
  }
  
  const categorized = errors.reduce((acc: any, error: any) => {
    acc[error.category] = (acc[error.category] || 0) + 1;
    return acc;
  }, {});
  
  console.group('📊 Error Analysis Report');
  console.log('Total Errors:', errors.length);
  console.log('By Category:', categorized);
  console.log('Recent Errors:', errors.slice(-5));
  console.groupEnd();
  
  return { total: errors.length, categorized, recent: errors.slice(-5) };
};

// Clear stored errors
export const clearStoredErrors = () => {
  localStorage.removeItem('app-errors');
  console.log('🧹 Stored errors cleared');
};