/**
 * Global network error handler for better timeout management
 */

// Suppress common network timeout errors
export function setupNetworkErrorHandling(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections specifically for network timeouts
  const originalRejectionHandler = window.onunhandledrejection;

  window.onunhandledrejection = (event) => {
    const error = event.reason;

    if (error && typeof error === 'object') {
      // Handle timeout errors from logo fetching
      if (error.message && error.message.includes('Timeout after')) {
        console.warn('🔇 [NetworkHandler] Suppressed unhandled timeout rejection:', error.message);
        event.preventDefault();
        return;
      }

      // Handle network errors and asset loading errors
      if (error.message && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_TIMED_OUT') ||
        error.message.includes('attached_assets') ||
        error.message.includes('background.js') ||
        error.message.includes('404 (Not Found)') ||
        error.message.includes('Invalid or unexpected token')
      )) {
        console.warn('🌐 [NetworkHandler] Suppressed network/asset rejection:', error.message);
        event.preventDefault();
        return;
      }
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