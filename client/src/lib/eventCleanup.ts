
// EventEmitter cleanup utility to prevent memory leaks
class EventCleanupManager {
  private listeners: Map<string, Array<{ target: any; event: string; handler: Function }>> = new Map();

  addListener(id: string, target: any, event: string, handler: Function) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id)!.push({ target, event, handler });
    target.addEventListener(event, handler);
  }

  removeListeners(id: string) {
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach(({ target, event, handler }) => {
        try {
          target.removeEventListener(event, handler);
        } catch (error) {
          console.warn(`Failed to remove listener for ${event}:`, error);
        }
      });
      this.listeners.delete(id);
    }
  }

  cleanup() {
    for (const id of this.listeners.keys()) {
      this.removeListeners(id);
    }
  }
}

export const eventCleanupManager = new EventCleanupManager();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    eventCleanupManager.cleanup();
  });
}
