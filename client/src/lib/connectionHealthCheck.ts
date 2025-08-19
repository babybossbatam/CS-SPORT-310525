
class ConnectionHealthChecker {
  private static instance: ConnectionHealthChecker;
  private isOnline: boolean = navigator.onLine;
  private lastSuccessfulConnection: number = Date.now();
  private connectionListeners: ((isConnected: boolean) => void)[] = [];

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Periodic health check
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  static getInstance(): ConnectionHealthChecker {
    if (!ConnectionHealthChecker.instance) {
      ConnectionHealthChecker.instance = new ConnectionHealthChecker();
    }
    return ConnectionHealthChecker.instance;
  }

  async performHealthCheck(): Promise<boolean> {
    if (!navigator.onLine) {
      this.isOnline = false;
      return false;
    }

    try {
      const baseUrl = window.location.origin || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
        cache: 'no-cache'
      });

      if (response.ok) {
        this.lastSuccessfulConnection = Date.now();
        this.isOnline = true;
        return true;
      } else {
        this.isOnline = false;
        return false;
      }
    } catch (error) {
      this.isOnline = false;
      console.warn('🔌 [ConnectionHealth] Server health check failed:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.isOnline && navigator.onLine;
  }

  getLastSuccessfulConnection(): number {
    return this.lastSuccessfulConnection;
  }

  onConnectionChange(callback: (isConnected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(isConnected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}

export const connectionHealthChecker = ConnectionHealthChecker.getInstance();
