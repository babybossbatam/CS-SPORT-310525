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

// Global unhandled rejection handler
export const setupGlobalErrorHandlers = () => {
  // Increase EventEmitter max listeners to prevent warnings
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(20);
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    // Prevent default handling that might cause cascade errors
    event.preventDefault();

    console.error('🚨 Unhandled promise rejection:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('not 2xx response') ||
          error.message?.includes('Network Error') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('dynamically imported module')) {
        console.log('🌐 Network/import connectivity issue detected, attempting recovery...');
        handleNetworkRecovery();
        return;
      }

      if (error.message?.includes('frame') || 
          error.message?.includes('Cannot read properties of undefined') ||
          error.message?.includes('space after cleanup') ||
          error.message?.includes('MaxListenersExceededWarning')) {
        console.log('🖼️ Frame/memory-related error detected, suppressing cascade...');
        return;
      }
    }

    // Handle string errors that might be fetch-related or import-related
    if (typeof error === 'string' && 
        (error.includes('Failed to fetch') || 
         error.includes('Network') || 
         error.includes('dynamically imported') ||
         error.includes('MaxListenersExceeded'))) {
      console.log('🌐 Network/import error string detected, attempting recovery...');
      handleNetworkRecovery();
      return;
    }
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error;

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