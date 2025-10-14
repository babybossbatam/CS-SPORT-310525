
// Optimized batch processor for reducing server load
export class OptimizedBatchProcessor {
  private static instance: OptimizedBatchProcessor;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 2; // Further reduced to prevent overload
  private readonly BATCH_DELAY = 200; // Increased delay for stability

  static getInstance(): OptimizedBatchProcessor {
    if (!OptimizedBatchProcessor.instance) {
      OptimizedBatchProcessor.instance = new OptimizedBatchProcessor();
    }
    return OptimizedBatchProcessor.instance;
  }

  async addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(wrappedRequest);
      this.processBatch();
    });
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.BATCH_SIZE);
      
      // Process batch with limited concurrency
      await Promise.allSettled(batch.map(request => request()));
      
      // Short delay between batches
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
      }
    }

    this.isProcessing = false;
  }
}
