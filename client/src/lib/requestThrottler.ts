
export class RequestThrottler {
  private static instance: RequestThrottler;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly delayBetweenRequests = 600; // 600ms delay

  static getInstance(): RequestThrottler {
    if (!RequestThrottler.instance) {
      RequestThrottler.instance = new RequestThrottler();
    }
    return RequestThrottler.instance;
  }

  async throttledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Throttled request failed:', error);
        }

        // Wait before processing next request
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
        }
      }
    }

    this.isProcessing = false;
  }

  getQueueSize(): number {
    return this.requestQueue.length;
  }

  clearQueue(): void {
    this.requestQueue = [];
    this.isProcessing = false;
  }
}

export const requestThrottler = RequestThrottler.getInstance();
