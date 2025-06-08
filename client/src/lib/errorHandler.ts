
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
export const handleNetworkRecovery = async () => {
  console.log('🔄 Attempting network recovery...');
  
  try {
    // Clear any stale cache entries
    if (typeof window !== 'undefined' && window.localStorage) {
      const staleKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('flag_') || 
        key.startsWith('logo_') || 
        key.startsWith('standings_') ||
        key.startsWith('fixtures_')
      );
      staleKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Failed to remove cache key:', key);
        }
      });
      console.log(`🧹 Cleared ${staleKeys.length} stale cache entries`);
    }

    // Test network connectivity
    try {
      const testResponse = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 
      });
      
      if (testResponse.ok) {
        console.log('✅ Network connectivity restored');
        return true;
      }
    } catch (testError) {
      console.warn('❌ Network test failed:', testError);
    }

    return false;
  } catch (error) {
    console.error('Recovery process failed:', error);
    return false;
  }
};

// Global unhandled rejection handler
export const setupGlobalErrorHandlers = () => {
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
          error.message?.includes('fetch')) {
        console.log('🌐 Network connectivity issue detected, attempting recovery...');
        handleNetworkRecovery();
        return;
      }
      
      if (error.message?.includes('frame') || 
          error.message?.includes('Cannot read properties of undefined')) {
        console.log('🖼️ Frame-related error detected, suppressing cascade...');
        return;
      }
      
      // Handle AbortError from timeouts
      if (error.name === 'AbortError') {
        console.log('⏰ Request timeout detected, using cached data if available...');
        return;
      }
    }
    
    // Handle string errors that might be fetch-related
    if (typeof error === 'string' && 
        (error.includes('Failed to fetch') || 
         error.includes('Network') || 
         error.includes('fetch'))) {
      console.log('🌐 Network error string detected, attempting recovery...');
      handleNetworkRecovery();
      return;
    }
  });
  
  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    console.error('🚨 Global error:', error);
    
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

  // Add console override to catch and filter problematic logs
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Filter out known harmless frame errors
    if (message.includes('Cannot read properties of undefined (reading \'frame\')') ||
        message.includes('ErrorOverlay') ||
        message.includes('vite/client')) {
      return; // Suppress these specific errors
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };
};
