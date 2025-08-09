
// EventEmitter utilities for managing listeners and preventing memory leaks

export const setGlobalEventEmitterLimits = (limit: number = 100) => {
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
  }
};

// Initialize with high limits
setGlobalEventEmitterLimits(200);
