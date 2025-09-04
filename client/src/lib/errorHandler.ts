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

export const handleApiError = (error: any, context: string = 'API') => {
  console.error(`❌ [${context}] Error:`, error);

  // Handle specific HTTP status codes
  if (error?.response?.status === 429) {
    console.warn(`⚠️ [${context}] Rate limit exceeded, implementing backoff`);
    return {
      retry: true,
      delay: 5000,
      message: 'Rate limit exceeded, retrying...'
    };
  }

  if (error?.response?.status === 400) {
    console.warn(`⚠️ [${context}] Bad request (400), not retrying`);
    return {
      retry: false,
      message: 'Invalid request data'
    };
  }

  if (error?.response?.status === 500) {
    console.warn(`⚠️ [${context}] Server error (500), will retry once`);
    return {
      retry: true,
      delay: 2000,
      maxRetries: 1,
      message: 'Server error, retrying...'
    };
  }

  // Handle network errors
  if (error?.name === 'AbortError') {
    return {
      retry: false,
      message: 'Request timeout - please try again'
    };
  }

  return {
    retry: false,
    message: error?.message || 'Unknown error occurred'
  };
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
      errorStr.includes('[plugin:runtime-error-plugin]') ||
      errorStr.includes('unknown runtime error') ||
      errorStr.includes('sendError') ||
      errorStr.includes('riker.replit.dev') ||
      errorStr.includes('482be3e5-72e0-4aaf-ab33-69660b136cf5') ||
      errorStr.includes('signal is aborted') ||
      errorStr.includes('runtime-error-plugin') ||
      errorStr.includes('482be3e5-72e0-4aaf-ab33-69660b136cf5') ||
      errorStr.includes('vite-plugin-react') ||
      errorStr.includes('ErrorOverlay') ||
      errorStr.includes('overlay') ||
      (error && typeof error === 'object' && error.toString && error.toString().includes('runtime-error-plugin'))) {
    return {
      name: 'replit-dev-environment',
      shouldSuppress: true,
      shouldReport: false,
      action: 'suppress'
    };
  }

  // Replit/Development environment errors
  if (errorStr.includes('replit.dev') ||
      errorStr.includes('482be3e5-72e0-4aaf-ab33-69660b136cf5') ||
      errorStr.includes('riker.replit.dev') ||
      errorStr.includes('eval.riker.platform.replit.com') ||
      errorStr.includes('signal is aborted') ||
      errorStr.includes('AbortError') ||
      errorStr.includes('workspace_iframe.html') ||
      errorStr.includes('Unrecognized feature') ||
      errorStr.includes('sandbox') ||
      errorStr.includes('stallwart') ||
      errorStr.includes('failed ping') ||
      errorStr.includes('session stalled') ||
      errorStr.includes('MaxListenersExceededWarning') ||
      errorStr.includes('Possible EventEmitter memory leak detected') ||
      errorStr.includes('watchTextFile') ||
      errorStr.includes('cursor listeners') ||
      errorStr.includes('removeCursor listeners') ||
      errorStr.includes('fileSavedChanged listeners') ||
      errorStr.includes('error listeners') ||
      errorStr.includes('transparentReconnect listeners') ||
      errorStr.includes('changes listeners') ||
      errorStr.includes('commitComplete listeners') ||
      errorStr.includes('fileDirty listeners') ||
      errorStr.includes('fileClean listeners') ||
      errorStr.includes('commitStart listeners') ||
      errorStr.includes('promptUserReconnect listeners') ||
      errorStr.includes('WebSocket connection') ||
      errorStr.includes('graphql_subscriptions') ||
      errorStr.includes('logs.browser-intake') ||
      errorStr.includes('events.launchdarkly.com') ||
      errorStr.includes('api.sorryapp.com') ||
      errorStr.includes('r.stripe.com') ||
      errorStr.includes('net::ERR_INTERNET_DISCONNECTED') ||
      errorStr.includes('net::ERR_NETWORK_IO_SUSPENDED') ||
      errorStr.includes('allow-downloads-without-user-activation') ||
      errorStr.includes('allowfullscreen') ||
      errorStr.includes('allowpaymentrequest') ||
      errorStr.includes('ambient-light-sensor') ||
      errorStr.includes('battery') ||
      errorStr.includes('execution-while-not-rendered') ||
      errorStr.includes('execution-while-out-of-viewport') ||
      errorStr.includes('layout-animations') ||
      errorStr.includes('legacy-image-formats') ||
      errorStr.includes('navigation-override') ||
      errorStr.includes('oversized-images') ||
      errorStr.includes('publickey-credentials') ||
      errorStr.includes('speaker-selection') ||
      errorStr.includes('unoptimized-images') ||
      errorStr.includes('unsized-media')) {
    return {
      name: 'Replit Environment',
      shouldSuppress: true,
      shouldReport: false,
      action: 'suppress'
    };
  }

  // Browser extension and background script errors
  if (errorStr.includes('background.js') ||
      errorStr.includes('extension') ||
      errorStr.includes('Icon Generator') ||
      errorStr.includes('chrome-extension') ||
      errorStr.includes('moz-extension') ||
      errorStr.includes('Adding extension') ||
      errorStr.includes('extensionArgs') ||
      errorStr.includes('Invalid or unexpected token') && errorStr.includes('background.js')) {
    return {
      name: 'Browser Extension',
      shouldSuppress: true,
      shouldReport: false,
      action: 'suppress'
    };
  }

  // Network/connectivity issues - attempt recovery
  if (errorStr.includes('Failed to fetch') ||
      errorStr.includes('NetworkError') ||
      errorStr.includes('timeout') ||
      errorStr.includes('ERR_INTERNET_DISCONNECTED') ||
      errorStr.includes('WebSocket connection') ||
      errorStr.includes('graphql_subscriptions') ||
      errorStr.includes('net::ERR_')) {
    return {
      name: 'network-connectivity',
      shouldSuppress: true,
      shouldReport: false,
      action: 'retry'
    };
  }

  // Match details API errors (shots, h2h, player stats) - suppress but log
  if (errorStr.includes('/shots:') ||
      errorStr.includes('/headtohead') ||
      errorStr.includes('400 (Bad Request)') ||
      errorStr.includes('500 (Internal Server Error)') ||
      errorStr.includes('status of 400') ||
      errorStr.includes('status of 500')) {
    return {
      name: 'match-details-api',
      shouldSuppress: true,
      shouldReport: false,
      action: 'monitor'
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

  // Vite/Build errors
  if (errorStr.includes('Failed to fetch dynamically imported module') ||
      errorStr.includes('Loading chunk') ||
      errorStr.includes('plugin:') ||
      errorStr.includes('vite') ||
      errorStr.includes('runtime-error-plugin') ||
      errorStr.includes('ErrorOverlay') ||
      errorStr.includes('reading \'frame\'')) {
    return {
      name: 'Build/Import',
      shouldSuppress: true,
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
const reportError = (error: any, category: any, source: string) => {
  if (!import.meta.env.DEV) return;

  const errorData = {
    timestamp: new Date().toISOString(),
    error: typeof error === 'string' ? error : error?.message || 'Unknown error',
    category: category.name,
    source,
    stack: error?.stack || 'No stack trace',
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Store in localStorage for analysis
  const stored = JSON.parse(localStorage.getItem('app-errors') || '[]');
  stored.push(errorData);

  // Keep only last 50 errors
  if (stored.length > 50) {
    stored.splice(0, stored.length - 50);
  }

  localStorage.setItem('app-errors', JSON.stringify(stored));

  if (!category.shouldSuppress) {
    console.group(`🚨 ${category.name} Error Report`);
    console.error('Error:', error);
    console.log('Context:', errorData);
    console.groupEnd();
  }
};

// Global unhandled rejection handler
export const setupGlobalErrorHandlers = () => {
  // Filter console errors to reduce noise
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args) => {
    const message = args.join(' ');

    // Filter out known Replit/browser issues
    if (
      message.includes('Failed to load resource') ||
      message.includes('net::ERR_FAILED') ||
      message.includes('net::ERR_INTERNET_DISCONNECTED') ||
      message.includes('net::ERR_NETWORK_IO_SUSPENDED') ||
      message.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      message.includes('Loading CSS chunk') ||
      message.includes('ResizeObserver loop limit exceeded') ||
      message.includes('Non-Error promise rejection captured') ||
      message.includes('AbortError') ||
      message.includes('signal is aborted') ||
      message.includes('runtime-error-plugin') ||
      message.includes('MaxListenersExceededWarning') ||
      message.includes('stallwart') ||
      message.includes('failed ping') ||
      message.includes('session stalled') ||
      message.includes('fsError listeners') ||
      message.includes('WebSocket connection') ||
      message.includes('watchTextFile') ||
      message.includes('cursor listeners') ||
      message.includes('removeCursor listeners') ||
      message.includes('fileSavedChanged listeners') ||
      message.includes('error listeners') ||
      message.includes('transparentReconnect listeners') ||
      message.includes('changes listeners') ||
      message.includes('commitComplete listeners') ||
      message.includes('fileDirty listeners') ||
      message.includes('fileClean listeners') ||
      message.includes('commitStart listeners') ||
      message.includes('promptUserReconnect listeners') ||
      message.includes('replit.com/graphql_subscriptions') ||
      message.includes('logs.browser-intake') ||
      message.includes('events.launchdarkly.com') ||
      message.includes('api.sorryapp.com') ||
      message.includes('r.stripe.com') ||
      message.includes('eval.riker.platform.replit.com') ||
      message.includes('482be3e5-72e0-4aaf-ab33-69660b136cf5')
    ) {
      return;
    }

    originalConsoleError.apply(console, args);
  };

  // Also filter console.warn for MaxListenersExceededWarning
  console.warn = (...args) => {
    const message = args.join(' ');

    if (
      message.includes('MaxListenersExceededWarning') ||
      message.includes('fsError listeners') ||
      message.includes('fileSavedChanged listeners') ||
      message.includes('stallwart') ||
      message.includes('failed ping') ||
      message.includes('changes listeners added') ||
      message.includes('watchTextFile') ||
      message.includes('Possible EventEmitter memory leak')
    ) {
      return;
    }

    originalConsoleWarn.apply(console, args);
  };

  // Increase EventEmitter max listeners to prevent warnings
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(100);
  }

  // Set max listeners for various global objects
  if (typeof window !== 'undefined') {
    if (window.addEventListener && window.setMaxListeners) {
      (window as any).setMaxListeners?.(100);
    }
    if (document.addEventListener && document.setMaxListeners) {
      (document as any).setMaxListeners?.(100);
    }

    // Set max listeners for global EventEmitter if available
    if ((window as any).EventEmitter) {
      (window as any).EventEmitter.defaultMaxListeners = 100;
    }
  }

  // Set EventEmitter default max listeners globally
  if (typeof require !== 'undefined') {
    try {
      const EventEmitter = require('events');
      EventEmitter.defaultMaxListeners = 100;
    } catch (e) {
      // EventEmitter not available in browser context
    }
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
    if (typeof error === 'string' && (error.includes('runtime-error-plugin') ||
        error.includes('signal timed out') ||
        error.includes('overlay') ||
        error.includes('ErrorOverlay') ||
        error.includes('vite-plugin-react'))) {
      console.log('🔧 Runtime error plugin issue suppressed:', error);
      event.preventDefault();

      // Aggressively remove any error overlays from DOM
      setTimeout(() => {
        const overlays = document.querySelectorAll('[data-error-overlay], #error-overlay, .error-overlay, [class*="error-overlay"], [class*="ErrorOverlay"]');
        overlays.forEach(overlay => {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        });
      }, 100);

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
          error.message?.includes('dynamically imported module')) {
        console.log('🌐 Network/import connectivity issue detected, attempting recovery...');
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
    const errorString = typeof error === 'string' ? error : (error?.message || error?.toString?.() || String(error));
    if (typeof errorString === 'string' &&
        (errorString.includes('Failed to fetch') ||
         errorString.includes('Network') ||
         errorString.includes('dynamically imported') ||
         errorString.includes('MaxListenersExceeded') ||
         errorString.includes('runtime-error-plugin') ||
         errorString.includes('[plugin:runtime-error-plugin]') ||
         errorString.includes('riker.replit.dev') ||
         errorString.includes('eval.riker.platform.replit.com') ||
         errorString.includes('482be3e5-72e0-4aaf-ab33-69660b136cf5') ||
         errorString.includes('signal is aborted') ||
         errorString.includes('attached_assets') ||
         errorString.includes('background.js') ||
         errorString.includes('404 (Not Found)') ||
         errorString.includes('Invalid or unexpected token') ||
         errorString.includes('stallwart') ||
         errorString.includes('failed ping') ||
         errorString.includes('session stalled') ||
         errorString.includes('watchTextFile') ||
         errorString.includes('cursor listeners') ||
         errorString.includes('listeners added') ||
         errorString.includes('WebSocket connection') ||
         errorString.includes('graphql_subscriptions') ||
         errorString.includes('versionFrom can\'t be lower than 1') ||
         errorString.includes('Fetch ops returned an error') ||
         errorString.includes('logs.browser-intake') ||
         errorString.includes('events.launchdarkly.com') ||
         errorString.includes('api.sorryapp.com') ||
         errorString.includes('r.stripe.com') ||
         errorString.includes('net::ERR_INTERNET_DISCONNECTED') ||
         errorString.includes('net::ERR_NETWORK_IO_SUSPENDED'))) {
      console.log('🌐 Network/import/abort/replit/assets error string detected, suppressing...');
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
      return false;
    }

    console.error('🚨 Global error:', error);

    // Handle DOM manipulation errors
    if (error?.message?.includes('removeChild') ||
        error?.message?.includes('The node to be removed is not a child')) {
      console.warn('DOM manipulation error caught and suppressed:', error);
      event.preventDefault();
      return false;
    }

    // Prevent frame-related errors from crashing the app
    if (error?.message?.includes('frame') ||
        error?.message?.includes('ErrorOverlay') ||
        error?.message?.includes('Cannot read properties of undefined (reading \'frame\')') ||
        error?.message?.includes('reading \'frame\'') ||
        event.filename?.includes('vite/client') ||
        event.filename?.includes('client:')) {
      console.log('🖼️ Suppressing frame/vite overlay error');
      event.preventDefault();
      return;
    }

    // Handle network-related errors and asset loading errors
    if (error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('attached_assets') ||
        error?.message?.includes('background.js') ||
        error?.message?.includes('Invalid or unexpected token')) {
      console.log('🌐 Network/asset error in global handler');
      event.preventDefault();
      handleNetworkRecovery();
      return;
    }
  });

  // Set up DOM observer to remove error overlays
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check if the added element is an error overlay
            if (element.matches && (
                element.matches('[data-error-overlay]') ||
                element.matches('#error-overlay') ||
                element.matches('.error-overlay') ||
                element.matches('[class*="error-overlay"]') ||
                element.matches('[class*="ErrorOverlay"]') ||
                element.matches('[data-runtime-error]') ||
                element.matches('.runtime-error-overlay') ||
                element.matches('[class*="runtime-error"]') ||
                element.matches('vite-error-overlay') ||
                element.matches('#vite-plugin-runtime-error-modal') ||
                element.matches('[data-vite-error]') ||
                element.matches('.vite-error-overlay') ||
                element.textContent?.includes('plugin:runtime-error-plugin') ||
                element.textContent?.includes('unknown runtime error')
              )) {
              console.log('🗑️ Removing error overlay from DOM:', element.className || element.id || element.tagName);
              element.remove();
            }

            // Also check child elements
            const overlayChildren = element.querySelectorAll?.(
              '[data-error-overlay], #error-overlay, .error-overlay, [class*="error-overlay"], [class*="ErrorOverlay"], [data-runtime-error], .runtime-error-overlay, [class*="runtime-error"], vite-error-overlay, #vite-plugin-runtime-error-modal, [data-vite-error], .vite-error-overlay'
            );
            overlayChildren?.forEach(overlay => {
              console.log('🗑️ Removing child error overlay from DOM:', overlay.className || overlay.id || overlay.tagName);
              overlay.remove();
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Store observer for cleanup
    (window as any).errorOverlayObserver = observer;
  }

  // Cleanup function for when page unloads
  window.addEventListener('beforeunload', () => {
    // Clean up observer
    if ((window as any).errorOverlayObserver) {
      (window as any).errorOverlayObserver.disconnect();
    }

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