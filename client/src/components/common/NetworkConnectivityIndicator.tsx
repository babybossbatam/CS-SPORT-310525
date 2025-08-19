
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { connectionHealthChecker } from '@/lib/connectionHealthCheck';

export function NetworkConnectivityIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribe = connectionHealthChecker.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Initial check
    connectionHealthChecker.performHealthCheck().then(setIsConnected);

    return unsubscribe;
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    const connected = await connectionHealthChecker.performHealthCheck();
    setIsConnected(connected);
    setIsChecking(false);
  };

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">
          Connection lost. Some features may not work properly.
        </span>
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="ml-4 flex items-center gap-1 text-orange-600 hover:text-orange-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </AlertDescription>
    </Alert>
  );
}
