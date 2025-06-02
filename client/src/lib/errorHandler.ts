
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
  console.log('Attempting network recovery...');
  
  // Clear any stale cache entries
  if (typeof window !== 'undefined' && window.localStorage) {
    const staleKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('flag_') || key.startsWith('logo_')
    );
    staleKeys.forEach(key => localStorage.removeItem(key));
  }
  
  // Force refresh after a short delay
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, 2000);
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
