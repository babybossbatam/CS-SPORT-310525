
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
    // Network-related errors
    if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return "Network error: Please check your internet connection and try again.";
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return "Request timeout: Please try again.";
    }
    
    // Server connection issues
    if (error.message.includes('server connection lost') || error.message.includes('WebSocket')) {
      return "Server connection lost: Reconnecting...";
    }
    
    // CORS errors
    if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
      return "Cross-origin request blocked. Please contact support.";
    }
    
    // Rate limiting
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return "Too many requests. Please wait a moment and try again.";
    }
    
    // Server errors
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return "Server error: Our team has been notified. Please try again later.";
    }
    
    // API quota/authentication errors
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('quota')) {
      return "Service temporarily unavailable. Please try again later.";
    }
    
    return error.message;
  }
  
  // Handle response objects
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    switch (status) {
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error: Our team has been notified. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return `Request failed with status ${status}. Please try again.`;
    }
  }
  
  return "An unexpected error occurred. Please try again.";
};

// Add network recovery helper with better retry mechanism
export const handleNetworkRecovery = () => {
  console.log('Attempting network recovery...');
  
  // Don't clear cache immediately - try to work with what we have
  // Only clear truly stale entries (older than 24 hours)
  if (typeof window !== 'undefined' && window.localStorage) {
    const now = Date.now();
    const staleKeys = Object.keys(localStorage).filter(key => {
      if (key.startsWith('flag_') || key.startsWith('logo_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const ageHours = (now - (data.timestamp || 0)) / (1000 * 60 * 60);
          return ageHours > 24; // Only remove entries older than 24 hours
        } catch {
          return true; // Remove corrupted entries
        }
      }
      return false;
    });
    staleKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${staleKeys.length} stale cache entries`);
  }
  
  // Try to reconnect before forcing refresh
  let retryCount = 0;
  const maxRetries = 3;
  
  const attemptReconnect = () => {
    retryCount++;
    console.log(`Reconnection attempt ${retryCount}/${maxRetries}`);
    
    fetch('/api/health-check')
      .then(response => {
        if (response.ok) {
          console.log('Network connection restored');
          // Don't reload, let the app continue
          return;
        }
        throw new Error('Health check failed');
      })
      .catch(() => {
        if (retryCount < maxRetries) {
          setTimeout(attemptReconnect, 2000 * retryCount); // Exponential backoff
        } else {
          console.log('Max retries reached, forcing reload');
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
      });
  };
  
  setTimeout(attemptReconnect, 1000);
};

// Global unhandled rejection handler
export const setupGlobalErrorHandlers = () => {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Optionally show user-friendly error message
  });
  
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
};
