
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
    // Don't reset errorHandled to prevent infinite loops
  } else {
    target.src = '/assets/fallback-logo.png';
  }
};

export const handleApiError = (error: unknown): string => {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return "Network error: Please check your internet connection and try again.";
    }
    if (error.message.includes('timeout')) {
      return "Request timeout: Please try again.";
    }
    return error.message;
  }
  
  return "An unexpected error occurred. Please try again.";
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
