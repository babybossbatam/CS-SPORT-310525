
/**
 * Global network error handler for better timeout management
 */

// Suppress common network timeout errors
export function setupNetworkErrorHandling(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections specifically for network timeouts
  const originalRejectionHandler = window.onunhandledrejection;
  
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    
    // Check if it's a network timeout or connection error
    if (reason?.message && (
      reason.message.includes('Timeout after') ||
      reason.message.includes('ERR_CONNECTION_TIMED_OUT') ||
      reason.message.includes('ERR_NAME_NOT_RESOLVED') ||
      reason.message.includes('Failed to fetch')
    )) {
      console.warn('🌐 [NetworkHandler] Suppressed network error:', reason.message);
      event.preventDefault();
      return;
    }
    
    // Call original handler for other errors
    if (originalRejectionHandler) {
      originalRejectionHandler.call(window, event);
    }
  };

  // Handle regular errors that might be network-related
  const originalErrorHandler = window.onerror;
  
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && (
      message.includes('ERR_CONNECTION_TIMED_OUT') ||
      message.includes('ERR_NAME_NOT_RESOLVED') ||
      message.includes('Failed to load resource')
    )) {
      console.warn('🌐 [NetworkHandler] Suppressed network resource error:', message);
      return true; // Prevent default error handling
    }
    
    // Call original handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler.call(window, message, source, lineno, colno, error);
    }
    
    return false;
  };
}

// Auto-setup when imported
setupNetworkErrorHandling();

export default setupNetworkErrorHandling;
