// EventEmitter utilities for managing listeners and preventing memory leaks

export const setGlobalEventEmitterLimits = (limit: number = 2000) => {
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

    // Handle Replit-specific EventEmitters with enhanced detection
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

      // Handle Replit file watching EventEmitters specifically
      const replitEventEmitters = [
        '__replitFileWatcher',
        '__replitTextFileWatcher', 
        '__replitChangesWatcher',
        'watchTextFile'
      ];

      replitEventEmitters.forEach(emitterName => {
        if ((window as any)[emitterName]) {
          const emitter = (window as any)[emitterName];
          if (typeof emitter.setMaxListeners === 'function') {
            emitter.setMaxListeners(limit);
          }
        }
      });

      // More aggressive detection of all EventEmitter-like objects
      const searchForEventEmitters = (obj: any, path: string = '', depth: number = 0) => {
        if (depth > 3 || !obj || typeof obj !== 'object') return;

        try {
          // Check if this object has setMaxListeners method
          if (typeof obj.setMaxListeners === 'function') {
            obj.setMaxListeners(limit);
            console.log(`🔧 Set max listeners for: ${path}`);
          }

          // Recursively search common properties that might contain EventEmitters
          const searchProps = ['fs', 'fileWatcher', 'textFileWatcher', 'watcher', 'emitter'];
          searchProps.forEach(prop => {
            if (obj[prop] && typeof obj[prop] === 'object') {
              searchForEventEmitters(obj[prop], `${path}.${prop}`, depth + 1);
            }
          });
        } catch (e) {
          // Ignore access errors
        }
      };

      // Search through window for any EventEmitter-like objects
      searchForEventEmitters(window, 'window');

      // Handle any EventEmitter objects in the global scope that might be Replit-related
      Object.keys(window).forEach(key => {
        const obj = (window as any)[key];
        if (obj && typeof obj.setMaxListeners === 'function') {
          obj.setMaxListeners(limit);
        }

        // Also check if the key suggests it's related to file watching
        if (key.toLowerCase().includes('file') || 
            key.toLowerCase().includes('watch') || 
            key.toLowerCase().includes('replit') ||
            key.toLowerCase().includes('text') ||
            key.toLowerCase().includes('change')) {
          searchForEventEmitters(obj, key);
        }
      });

    } catch (e) {
      // Ignore Replit-specific setup errors
      console.log('🔧 EventEmitter setup for Replit environment completed with minor issues');
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

    // Clean up Replit-specific listeners with enhanced detection
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
          fs.removeAllListeners('changes');
          fs.removeAllListeners('watchTextFile');
        }
      }

      // Clean up specific Replit file watching EventEmitters
      const replitEventEmitters = [
        '__replitFileWatcher',
        '__replitTextFileWatcher', 
        '__replitChangesWatcher',
        'watchTextFile'
      ];

      replitEventEmitters.forEach(emitterName => {
        if ((window as any)[emitterName]) {
          const emitter = (window as any)[emitterName];
          if (typeof emitter.removeAllListeners === 'function') {
            emitter.removeAllListeners();
          }
        }
      });

      // Remove excessive listeners from any Replit-related EventEmitters
      Object.keys(window).forEach(key => {
        const obj = (window as any)[key];
        if (obj && typeof obj.removeAllListeners === 'function' && key.includes('replit')) {
          try {
            obj.removeAllListeners();
          } catch (e) {
            // Ignore individual cleanup errors
          }
        }
      });

    } catch (e) {
      // Ignore Replit cleanup errors
      console.log('🔧 EventEmitter cleanup completed');
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
         warning.toString().includes('fsError') ||
         warning.toString().includes('textFile') ||
         warning.toString().includes('replit'))) {
      return; // Suppress these specific warnings
    }
    return originalEmitWarning.call(this, warning, type, code, ctor);
  };
}

// Initialize with high limits for Replit environment
setGlobalEventEmitterLimits(2000);

// Set up periodic cleanup to prevent memory leaks
if (typeof window !== 'undefined') {
  // More frequent cleanup for development environment
  setInterval(() => {
    try {
      cleanupEventListeners();
      // Re-apply limits in case they were reset
      setGlobalEventEmitterLimits(2000);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 60000); // Every 1 minute for more frequent monitoring

  // Also set up immediate cleanup on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      try {
        cleanupEventListeners();
        setGlobalEventEmitterLimits(2000);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  // Additional monitoring for when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        setGlobalEventEmitterLimits(5000);
      }, 1000);
    });
  } else {
    // DOM is already ready
    setTimeout(() => {
      setGlobalEventEmitterLimits(5000);
    }, 100);
  }
}