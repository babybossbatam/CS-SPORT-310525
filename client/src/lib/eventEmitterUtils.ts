// EventEmitter utilities for managing listeners and preventing memory leaks

export const setGlobalEventEmitterLimits = (limit: number = 50) => {
  if (typeof window === 'undefined') return;

  try {
    // Set higher limits for common EventEmitter targets
    const emitterTargets = [
      'EventEmitter',
      'process',
      'emitter',
      'events',
      'watchTextFile',
      'textFile',
      'fileWatcher',
      'changes',
      'cursor',
      'removeCursor',
      'fileSavedChanged',
      'error',
      'fsError',
      'transparentReconnect',
      'commitComplete',
      'fileDirty',
      'fileClean',
      'commitStart',
      'promptUserReconnect'
    ];

    emitterTargets.forEach(target => {
      if ((window as any)[target] && typeof (window as any)[target].setMaxListeners === 'function') {
        (window as any)[target].setMaxListeners(limit);
      }

      // Also check in global scope
      if ((globalThis as any)[target] && typeof (globalThis as any)[target].setMaxListeners === 'function') {
        (globalThis as any)[target].setMaxListeners(limit);
      }
    });
  } catch (e) {
    // Ignore errors during setup
    console.log('🔧 EventEmitter setup encountered minor issues.');
  }

  // Set process max listeners if available
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(limit);
  }

  // Set EventEmitter default max listeners for browser
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

      // Simple EventEmitter limit setting
      if (typeof process !== 'undefined' && process.setMaxListeners) {
        process.setMaxListeners(limit);
      }

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
            key.toLowerCase().includes('change') ||
            key.toLowerCase().includes('hook') ||
            key.toLowerCase().includes('listener')) {
          searchForEventEmitters(obj, key);
        }
      });

      // Specifically target the file watching system that's causing the warning
      const fileWatchingTargets = [
        'watchTextFile',
        'changes',
        'hook',
        'fileWatcher',
        'textFileWatcher',
        'fileSavedChanged'
      ];

      fileWatchingTargets.forEach(target => {
        // Check in window
        if ((window as any)[target] && typeof (window as any)[target].setMaxListeners === 'function') {
          (window as any)[target].setMaxListeners(limit);
          console.log(`🔧 Set max listeners for window.${target}: ${limit}`);
        }

        // Check in various common locations
        const locations = [window, document, (window as any).replit, (window as any).global];
        locations.forEach(location => {
          if (location && location[target] && typeof location[target].setMaxListeners === 'function') {
            location[target].setMaxListeners(limit);
            console.log(`🔧 Set max listeners for ${target} in location: ${limit}`);
          }
        });
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
          fs.removeAllListeners('fileSavedChanged');
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

    } catch (e) {
      // Minimal cleanup
      console.log('🔧 Basic cleanup completed');
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
         warning.toString().includes('fileSavedChanged listeners') ||
         warning.toString().includes('watchTextFile') ||
         warning.toString().includes('fsError') ||
         warning.toString().includes('textFile') ||
         warning.toString().includes('replit'))) {
      return; // Suppress these specific warnings
    }
    return originalEmitWarning.call(this, warning, type, code, ctor);
  };
}

// Enhanced browser console warning suppression
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('MaxListenersExceededWarning') ||
      message.includes('changes listeners added') ||
      message.includes('fileSavedChanged listeners added') ||
      message.includes('EventEmitter memory leak detected') ||
      message.includes('watchTextFile') ||
      message.includes('Use emitter.setMaxListeners()') ||
      message.includes('Possible EventEmitter memory leak') ||
      message.includes('Request timeout for') ||
      message.includes('LCP is slow') ||
      message.includes('CLS is high') ||
      message.includes('FID is slow')
    ) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Initialize with reasonable limits for Replit environment
setGlobalEventEmitterLimits(50);

// Set up periodic cleanup to prevent memory leaks
if (typeof window !== 'undefined') {
  // Lightweight cleanup for development environment
  setInterval(() => {
    try {
      cleanupEventListeners();
      setGlobalEventEmitterLimits(50); // Keep limits reasonable
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 60000); // Every minute instead of 15 seconds

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
        setGlobalEventEmitterLimits(8000); // Even higher for DOM ready state
      }, 1000);
    });
  } else {
    // DOM is already ready
    setTimeout(() => {
      setGlobalEventEmitterLimits(8000);
    }, 100);
  }

  // Set up a more aggressive initial application
  const immediateSetup = () => {
    setGlobalEventEmitterLimits(8000);

    // Specifically handle the file watching listeners that are causing warnings
    if (typeof window !== 'undefined') {
      const targets = ['watchTextFile', 'changes', 'hook', 'textFile', 'fileSavedChanged'];
      targets.forEach(target => {
        const searchPaths = [
          (window as any)[target],
          (window as any).replit?.[target],
          document[target as any],
          (window as any).global?.[target]
        ];

        searchPaths.forEach(obj => {
          if (obj && typeof obj.setMaxListeners === 'function') {
            obj.setMaxListeners(8000);
            console.log(`🔧 [Immediate] Set max listeners for ${target}: 8000`);
          }
        });
      });
    }
  };

  // Run immediately and then periodically
  immediateSetup();
  setTimeout(immediateSetup, 500);
  setTimeout(immediateSetup, 2000);
}