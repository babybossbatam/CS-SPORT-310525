
// EventEmitter utilities for managing listeners and preventing memory leaks

export const setGlobalEventEmitterLimits = (limit: number = 300) => {
  // Set process max listeners
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(limit);
  }

  // Set EventEmitter default max listeners
  if (typeof window !== 'undefined') {
    (window as any).maxEventListeners = limit;
    
    if ((window as any).EventEmitter) {
      (window as any).EventEmitter.defaultMaxListeners = limit;
    }

    // Override Node.js EventEmitter in browser context if available
    if ((window as any).require) {
      try {
        const events = (window as any).require('events');
        if (events && events.EventEmitter) {
          events.EventEmitter.defaultMaxListeners = limit;
        }
      } catch (e) {
        // Ignore if not available
      }
    }

    // Handle Replit-specific EventEmitters
    try {
      // Set limits for Replit file system watchers
      if ((window as any).replit && (window as any).replit.fs) {
        const fs = (window as any).replit.fs;
        if (fs.setMaxListeners) {
          fs.setMaxListeners(limit);
        }
      }

      // Handle other Replit EventEmitters that might cause warnings
      if ((window as any).stallwart && (window as any).stallwart.setMaxListeners) {
        (window as any).stallwart.setMaxListeners(limit);
      }
    } catch (e) {
      // Ignore Replit-specific setup errors
    }
  }

  // Set for Node.js EventEmitter if available
  try {
    if (typeof require !== 'undefined') {
      const EventEmitter = require('events');
      EventEmitter.defaultMaxListeners = limit;
    }
  } catch (e) {
    // EventEmitter not available
  }
};

export const cleanupEventListeners = () => {
  // Clean up any global event listeners if needed
  if (typeof window !== 'undefined') {
    // Remove excessive event listeners from common objects
    const commonElements = [window, document];
    
    commonElements.forEach(element => {
      if (element && typeof element.removeAllListeners === 'function') {
        try {
          element.removeAllListeners();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    // Clean up Replit-specific listeners
    try {
      // Remove stallwart-related listeners if they exist
      if ((window as any).stallwart) {
        (window as any).stallwart.removeAllListeners?.();
      }
      
      // Clean up file watching listeners
      if ((window as any).replit && (window as any).replit.fs) {
        const fs = (window as any).replit.fs;
        if (fs.removeAllListeners) {
          fs.removeAllListeners('fsError');
        }
      }
    } catch (e) {
      // Ignore Replit cleanup errors
    }
  }
};

// Suppress process warnings for Replit environment
if (typeof process !== 'undefined') {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function(warning, type, code, ctor) {
    // Suppress MaxListenersExceededWarning for file watching
    if (type === 'MaxListenersExceededWarning' && 
        (warning.toString().includes('changes listeners') || 
         warning.toString().includes('watchTextFile') ||
         warning.toString().includes('fsError'))) {
      return; // Suppress these specific warnings
    }
    return originalEmitWarning.call(this, warning, type, code, ctor);
  };
}

// Initialize with high limits for Replit environment
setGlobalEventEmitterLimits(500);

// Set up periodic cleanup to prevent memory leaks
if (typeof window !== 'undefined') {
  setInterval(() => {
    try {
      cleanupEventListeners();
      // Re-apply limits in case they were reset
      setGlobalEventEmitterLimits(500);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 300000); // Every 5 minutes
}
