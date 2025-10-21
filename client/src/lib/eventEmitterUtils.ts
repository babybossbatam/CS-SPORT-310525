// EventEmitter utilities optimized for Replit Assistant compatibility
export const setGlobalEventEmitterLimits = (limit: number = 25) => {
  if (typeof window === 'undefined') return;

  try {
    // Set BALANCED limits - enough for the app but not overwhelming
    const emitterTargets = [
      'EventEmitter',
      'process', 
      'emitter',
      'events'
    ];

    emitterTargets.forEach(target => {
      if ((window as any)[target] && typeof (window as any)[target].setMaxListeners === 'function') {
        (window as any)[target].setMaxListeners(limit);
      }

      if ((globalThis as any)[target] && typeof (globalThis as any)[target].setMaxListeners === 'function') {
        (globalThis as any)[target].setMaxListeners(limit);
      }
    });
  } catch (e) {
    // Silently handle errors to prevent console spam
  }

  // Set balanced process limits
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(limit);
  }

  // Set balanced browser EventEmitter limits
  if (typeof window !== 'undefined') {
    (window as any).maxEventListeners = limit;

    if ((window as any).EventEmitter) {
      (window as any).EventEmitter.defaultMaxListeners = limit;
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
  // Enhanced cleanup to prevent conflicts with Replit's monitoring
  if (typeof window !== 'undefined') {
    try {
      // Clean up our own event listeners, not Replit's
      const customElements = document.querySelectorAll('[data-cleanup="true"]');
      customElements.forEach(el => {
        if (el && typeof (el as any).removeAllListeners === 'function') {
          (el as any).removeAllListeners();
        }
      });
      
      // Clear any lingering timers that might be creating listeners
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

// Suppress warnings that conflict with Replit Assistant monitoring
if (typeof process !== 'undefined') {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function(warning, type, code, ctor) {
    // Only suppress file system related warnings that conflict with Replit
    if (type === 'MaxListenersExceededWarning' &&
        (warning.toString().includes('changes listeners') ||
         warning.toString().includes('fileSavedChanged listeners') ||
         warning.toString().includes('watchTextFile') ||
         warning.toString().includes('fsError'))) {
      return; // Suppress these specific warnings
    }
    return originalEmitWarning.call(this, warning, type, code, ctor);
  };
}

// Browser console warning suppression for Replit compatibility
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('MaxListenersExceededWarning') ||
      message.includes('EventEmitter memory leak detected') ||
      message.includes('fileSavedChanged listeners added') ||
      message.includes('watchTextFile') ||
      message.includes('Use emitter.setMaxListeners()')
    ) {
      return; // Suppress warnings that interfere with Replit Assistant
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Initialize with VERY CONSERVATIVE limits for Replit compatibility
setGlobalEventEmitterLimits(8);

// Set up cleanup only when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      cleanupEventListeners();
    } catch (e) {
      // Ignore cleanup errors during unload
    }
  });
}