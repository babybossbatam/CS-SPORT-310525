
<line_number>1</line_number>
class RequestThrottle {
  private queue: Array<() => Promise<any>> = [];
  private running: Set<Promise<any>> = new Set();
  private maxConcurrent: number = 3;
  private delay: number = 500; // 500ms between requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const requestFn = this.queue.shift();
    if (!requestFn) return;

    const promise = this.executeWithDelay(requestFn);
    this.running.add(promise);

    try {
      await promise;
    } finally {
      this.running.delete(promise);
      this.processQueue(); // Process next item
    }
  }

  private async executeWithDelay(requestFn: () => Promise<any>) {
    if (this.running.size > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    return requestFn();
  }
}

export const requestThrottle = new RequestThrottle();
