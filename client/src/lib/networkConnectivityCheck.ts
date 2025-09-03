
/**
 * Network connectivity diagnostic utility
 */

export interface NetworkDiagnostic {
  isOnline: boolean;
  serverReachable: boolean;
  apiReachable: boolean;
  latency: number | null;
  timestamp: string;
}

export async function diagnoseNetworkConnectivity(): Promise<NetworkDiagnostic> {
  const startTime = Date.now();
  
  const diagnostic: NetworkDiagnostic = {
    isOnline: navigator.onLine,
    serverReachable: false,
    apiReachable: false,
    latency: null,
    timestamp: new Date().toISOString()
  };

  try {
    // Test server connectivity
    const serverStart = Date.now();
    const serverResponse = await fetch('/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (serverResponse.ok) {
      diagnostic.serverReachable = true;
      diagnostic.latency = Date.now() - serverStart;
    }
  } catch (error) {
    console.warn('Server connectivity test failed:', error);
  }

  try {
    // Test API connectivity with a simple endpoint
    const apiResponse = await fetch('/api/fixtures/live', {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    diagnostic.apiReachable = apiResponse.ok;
  } catch (error) {
    console.warn('API connectivity test failed:', error);
  }

  return diagnostic;
}

export function logNetworkDiagnostic(diagnostic: NetworkDiagnostic) {
  console.group('🌐 Network Diagnostic Report');
  console.log('Browser Online:', diagnostic.isOnline);
  console.log('Server Reachable:', diagnostic.serverReachable);
  console.log('API Reachable:', diagnostic.apiReachable);
  console.log('Latency:', diagnostic.latency ? `${diagnostic.latency}ms` : 'N/A');
  console.log('Timestamp:', diagnostic.timestamp);
  console.groupEnd();
}

// Auto-diagnose on severe network errors
export async function autoDiagnoseOnError() {
  const diagnostic = await diagnoseNetworkConnectivity();
  logNetworkDiagnostic(diagnostic);
  return diagnostic;
}
