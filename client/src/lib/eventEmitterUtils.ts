// EventEmitter utility to prevent memory leaks
import { EventEmitter } from 'events';

// Set global limits immediately
const setGlobalEventEmitterLimits = (maxListeners: number = 50) => {
  if (typeof EventEmitter !== 'undefined') {
    EventEmitter.defaultMaxListeners = maxListeners;
  }

  // Set for Node.js process if available
  if (typeof process !== 'undefined') {
    process.setMaxListeners?.(maxListeners);

    // Set for common Node.js streams
    process.stdout?.setMaxListeners?.(maxListeners);
    process.stderr?.setMaxListeners?.(maxListeners);
    process.stdin?.setMaxListeners?.(maxListeners);
  }

  // Set for browser environment
  if (typeof window !== 'undefined') {
    (window as any).maxEventListeners = maxListeners;

    // Set for common browser objects
    if (window.addEventListener) {
      try { (window as any).setMaxListeners?.(maxListeners); } catch (e) {}
    }
    if (document.addEventListener) {
      try { (document as any).setMaxListeners?.(maxListeners); } catch (e) {}
    }
  }
};

// Initialize with reasonable limits
setGlobalEventEmitterLimits(20);

export { setGlobalEventEmitterLimits };