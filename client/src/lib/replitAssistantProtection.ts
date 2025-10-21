
// Replit Assistant Protection System
// Prevents overwhelming the IDE's AI assistant with too many events

class ReplitAssistantProtection {
  private static instance: ReplitAssistantProtection;
  private eventQueue: Array<() => void> = [];
  private isProcessing = false;
  private maxConcurrentOperations = 2; // Very conservative
  private operationDelay = 500; // 500ms between operations

  static getInstance(): ReplitAssistantProtection {
    if (!ReplitAssistantProtection.instance) {
      ReplitAssistantProtection.instance = new ReplitAssistantProtection();
    }
    return ReplitAssistantProtection.instance;
  }

  // Queue operations to prevent overwhelming Replit Assistant
  queueOperation(operation: () => void): void {
    this.eventQueue.push(operation);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      // Process only a few operations at a time
      const batch = this.eventQueue.splice(0, this.maxConcurrentOperations);
      
      // Execute batch with delay
      for (const operation of batch) {
        try {
          operation();
          // Add delay between operations
          await new Promise(resolve => setTimeout(resolve, this.operationDelay));
        } catch (error) {
          console.warn('Queued operation failed:', error);
        }
      }

      // Longer delay between batches
      if (this.eventQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessing = false;
  }

  // Throttle API calls to prevent overwhelming the system
  throttleApiCall<T>(fn: () => Promise<T>, delay: number = 2000): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queueOperation(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

export const replitProtection = ReplitAssistantProtection.getInstance();

// Global rate limiting for fetch operations
const originalFetch = window.fetch;
let lastFetchTime = 0;
const minFetchInterval = 200; // Minimum 200ms between fetches

window.fetch = async (...args) => {
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime;
  
  if (timeSinceLastFetch < minFetchInterval) {
    await new Promise(resolve => 
      setTimeout(resolve, minFetchInterval - timeSinceLastFetch)
    );
  }
  
  lastFetchTime = Date.now();
  return originalFetch(...args);
};

console.log('🛡️ Replit Assistant Protection System initialized');
