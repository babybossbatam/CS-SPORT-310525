
// Browser-compatible EventEmitter utility to prevent memory leaks
class SimpleEventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  private maxListeners: number = 50;

  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  on(event: string, listener: Function): this {
    const listeners = this.listeners.get(event) || [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    
    if (listeners.length > this.maxListeners) {
      console.warn(`Possible memory leak detected. ${listeners.length} listeners added for event "${event}". Use setMaxListeners() to increase limit.`);
    }
    
    return this;
  }

  removeListener(event: string, listener: Function): this {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, listeners);
      }
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
    return listeners.length > 0;
  }
}

// Set global limits immediately for browser environment
const setGlobalEventEmitterLimits = (maxListeners: number = 50) => {
  // Set for browser environment
  if (typeof window !== 'undefined') {
    (window as any).maxEventListeners = maxListeners;

    // Set for common browser objects that support event listeners
    const browserObjects = [window, document];
    browserObjects.forEach(obj => {
      if (obj && typeof obj.addEventListener === 'function') {
        try {
          if (typeof (obj as any).setMaxListeners === 'function') {
            (obj as any).setMaxListeners(maxListeners);
          }
        } catch (e) {
          // Ignore errors for objects that don't support setMaxListeners
        }
      }
    });

    // Handle specific Replit environment objects
    const replitObjects = ['watchTextFile', 'changes', 'hook', 'textFile', 'fileWatcher'];
    replitObjects.forEach(objName => {
      if ((window as any)[objName] && typeof (window as any)[objName].setMaxListeners === 'function') {
        try {
          (window as any)[objName].setMaxListeners(maxListeners);
        } catch (e) {
          // Ignore errors
        }
      }
    });
  }

  // Set for global objects if they exist
  if (typeof globalThis !== 'undefined') {
    try {
      (globalThis as any).maxEventListeners = maxListeners;
    } catch (e) {
      // Ignore
    }
  }
};

// Initialize with reasonable limits for browser environment
setGlobalEventEmitterLimits(100);

// Create a global event emitter instance for the app
const globalEventEmitter = new SimpleEventEmitter();
globalEventEmitter.setMaxListeners(100);

export { 
  setGlobalEventEmitterLimits, 
  SimpleEventEmitter,
  globalEventEmitter
};
