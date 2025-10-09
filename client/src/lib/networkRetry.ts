
export class NetworkRetryManager {
  private static instance: NetworkRetryManager;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000;

  static getInstance(): NetworkRetryManager {
    if (!NetworkRetryManager.instance) {
      NetworkRetryManager.instance = new NetworkRetryManager();
    }
    return NetworkRetryManager.instance;
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        lastError = error as Error;
        const isNetworkError = this.isNetworkError(error);
        
        if (!isNetworkError || attempt === maxRetries) {
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        await this.delay(delay);
        
        console.log(`🔄 [NetworkRetry] Retry attempt ${attempt + 1}/${maxRetries} for ${operationId}`);
      }
    }
    
    throw lastError!;
  }

  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorStr = error.toString().toLowerCase();
    return (
      errorStr.includes('failed to fetch') ||
      errorStr.includes('networkerror') ||
      errorStr.includes('err_internet_disconnected') ||
      errorStr.includes('websocket') ||
      errorStr.includes('timeout') ||
      errorStr.includes('net::err_') ||
      error.name === 'NetworkError' ||
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  setupOnlineListener(callback: (isOnline: boolean) => void): void {
    window.addEventListener('online', () => {
      console.log('🌐 [NetworkRetry] Connection restored');
      callback(true);
    });

    window.addEventListener('offline', () => {
      console.log('❌ [NetworkRetry] Connection lost');
      callback(false);
    });
  }
}

export const networkRetry = NetworkRetryManager.getInstance();
