
export interface ComponentCacheStats {
  componentName: string;
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  lastUpdated: string;
  cacheSize: number;
  errors: string[];
}

export interface ApiDebugInfo {
  endpoint: string;
  method: string;
  timestamp: string;
  responseTime: number;
  status: 'success' | 'error' | 'cached';
  cacheKey?: string;
  dataSize?: number;
  error?: string;
}

export interface LogoDebugInfo {
  type: 'team' | 'flag' | 'league';
  shape: 'circular' | 'normal';
  teamId?: number;
  country?: string;
  leagueId?: number;
  url: string;
  fallbackUsed: boolean;
  loadTime: number;
  component: string;
}

class CentralizedDebugCache {
  private componentStats: Map<string, ComponentCacheStats> = new Map();
  private apiLogs: ApiDebugInfo[] = [];
  private logoLogs: LogoDebugInfo[] = [];
  private maxLogSize = 1000;

  // Component registration and stats tracking
  registerComponent(componentName: string): void {
    if (!this.componentStats.has(componentName)) {
      this.componentStats.set(componentName, {
        componentName,
        cacheHits: 0,
        cacheMisses: 0,
        apiCalls: 0,
        lastUpdated: new Date().toISOString(),
        cacheSize: 0,
        errors: []
      });
    }
  }

  // Track API calls
  logApiCall(componentName: string, debugInfo: Omit<ApiDebugInfo, 'timestamp'>): void {
    this.registerComponent(componentName);
    
    const apiLog: ApiDebugInfo = {
      ...debugInfo,
      timestamp: new Date().toISOString()
    };

    this.apiLogs.unshift(apiLog);
    if (this.apiLogs.length > this.maxLogSize) {
      this.apiLogs.pop();
    }

    // Update component stats
    const stats = this.componentStats.get(componentName)!;
    stats.apiCalls++;
    if (debugInfo.status === 'cached') {
      stats.cacheHits++;
    } else if (debugInfo.status === 'success') {
      stats.cacheMisses++;
    } else if (debugInfo.status === 'error') {
      stats.errors.push(debugInfo.error || 'Unknown error');
    }
    stats.lastUpdated = new Date().toISOString();

    console.log(`🔍 [${componentName}] API Call:`, {
      endpoint: debugInfo.endpoint,
      status: debugInfo.status,
      responseTime: debugInfo.responseTime,
      cacheKey: debugInfo.cacheKey
    });
  }

  // Track logo loading
  logLogo(componentName: string, logoInfo: Omit<LogoDebugInfo, 'component'>): void {
    this.registerComponent(componentName);
    
    const logoLog: LogoDebugInfo = {
      ...logoInfo,
      component: componentName
    };

    this.logoLogs.unshift(logoLog);
    if (this.logoLogs.length > this.maxLogSize) {
      this.logoLogs.pop();
    }

    console.log(`🎨 [${componentName}] Logo Load:`, {
      type: logoInfo.type,
      shape: logoInfo.shape,
      url: logoInfo.url,
      fallbackUsed: logoInfo.fallbackUsed,
      loadTime: logoInfo.loadTime
    });
  }

  // Track cache operations
  logCacheOperation(componentName: string, operation: 'hit' | 'miss' | 'set', cacheKey: string, dataSize?: number): void {
    this.registerComponent(componentName);
    
    const stats = this.componentStats.get(componentName)!;
    
    if (operation === 'hit') {
      stats.cacheHits++;
    } else if (operation === 'miss') {
      stats.cacheMisses++;
    }
    
    if (dataSize) {
      stats.cacheSize = dataSize;
    }
    
    stats.lastUpdated = new Date().toISOString();

    console.log(`💾 [${componentName}] Cache ${operation.toUpperCase()}:`, {
      cacheKey,
      dataSize,
      hitRate: this.getCacheHitRate(componentName)
    });
  }

  // Get cache hit rate for a component
  getCacheHitRate(componentName: string): number {
    const stats = this.componentStats.get(componentName);
    if (!stats) return 0;
    
    const total = stats.cacheHits + stats.cacheMisses;
    return total > 0 ? (stats.cacheHits / total) * 100 : 0;
  }

  // Get all component stats
  getAllComponentStats(): ComponentCacheStats[] {
    return Array.from(this.componentStats.values()).sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  // Get recent API logs
  getRecentApiLogs(limit: number = 50): ApiDebugInfo[] {
    return this.apiLogs.slice(0, limit);
  }

  // Get recent logo logs
  getRecentLogoLogs(limit: number = 50): LogoDebugInfo[] {
    return this.logoLogs.slice(0, limit);
  }

  // Get API logs for specific component
  getComponentApiLogs(componentName: string, limit: number = 20): ApiDebugInfo[] {
    return this.apiLogs
      .filter(log => log.endpoint.includes(componentName.toLowerCase()) || 
                    this.isEndpointUsedByComponent(log.endpoint, componentName))
      .slice(0, limit);
  }

  // Get logo logs for specific component
  getComponentLogoLogs(componentName: string, limit: number = 20): LogoDebugInfo[] {
    return this.logoLogs
      .filter(log => log.component === componentName)
      .slice(0, limit);
  }

  // Helper to determine if endpoint is used by component
  private isEndpointUsedByComponent(endpoint: string, componentName: string): boolean {
    const componentEndpoints = {
      'MyHomeFeaturedMatchNew': ['/api/fixtures/date/', '/api/fixtures/live'],
      'TodayMatchPageCard': ['/api/fixtures/date/', '/api/fixtures/live'],
      'TodayMatchByTime': ['/api/fixtures/date/', '/api/fixtures/live'],
      'TodayPopularFootballLeaguesNew': ['/api/fixtures/date/'],
      'TodaysMatchesByCountryNew': ['/api/fixtures/date/'],
      'LiveMatchByTime': ['/api/fixtures/live'],
      'LiveMatchForAllCountry': ['/api/fixtures/live'],
    };

    const endpoints = componentEndpoints[componentName] || [];
    return endpoints.some(ep => endpoint.includes(ep));
  }

  // Clear all logs and stats
  clearAll(): void {
    this.componentStats.clear();
    this.apiLogs = [];
    this.logoLogs = [];
    console.log('🧹 [CentralizedDebugCache] All logs and stats cleared');
  }

  // Export debug data
  exportDebugData(): {
    components: ComponentCacheStats[];
    apiLogs: ApiDebugInfo[];
    logoLogs: LogoDebugInfo[];
    summary: {
      totalApiCalls: number;
      totalCacheHits: number;
      totalCacheMisses: number;
      averageHitRate: number;
      totalLogoLoads: number;
      totalFallbacks: number;
    };
  } {
    const components = this.getAllComponentStats();
    const totalApiCalls = components.reduce((sum, c) => sum + c.apiCalls, 0);
    const totalCacheHits = components.reduce((sum, c) => sum + c.cacheHits, 0);
    const totalCacheMisses = components.reduce((sum, c) => sum + c.cacheMisses, 0);
    const averageHitRate = components.length > 0 
      ? components.reduce((sum, c) => sum + this.getCacheHitRate(c.componentName), 0) / components.length
      : 0;
    
    const totalLogoLoads = this.logoLogs.length;
    const totalFallbacks = this.logoLogs.filter(log => log.fallbackUsed).length;

    return {
      components,
      apiLogs: this.apiLogs,
      logoLogs: this.logoLogs,
      summary: {
        totalApiCalls,
        totalCacheHits,
        totalCacheMisses,
        averageHitRate,
        totalLogoLoads,
        totalFallbacks
      }
    };
  }

  // Print summary to console
  printSummary(): void {
    const data = this.exportDebugData();
    
    console.group('📊 [CentralizedDebugCache] Summary Report');
    console.log('🔢 Overall Stats:', data.summary);
    console.log('📱 Component Performance:');
    
    data.components.forEach(comp => {
      console.log(`  ${comp.componentName}:`, {
        hitRate: `${this.getCacheHitRate(comp.componentName).toFixed(1)}%`,
        apiCalls: comp.apiCalls,
        errors: comp.errors.length,
        lastUpdated: comp.lastUpdated
      });
    });
    
    console.groupEnd();
  }
}

// Global instance
export const centralizedDebugCache = new CentralizedDebugCache();

// Convenience functions for components
export const logApiCall = (componentName: string, debugInfo: Omit<ApiDebugInfo, 'timestamp'>) => {
  centralizedDebugCache.logApiCall(componentName, debugInfo);
};

export const logLogo = (componentName: string, logoInfo: Omit<LogoDebugInfo, 'component'>) => {
  centralizedDebugCache.logLogo(componentName, logoInfo);
};

export const logCacheOperation = (componentName: string, operation: 'hit' | 'miss' | 'set', cacheKey: string, dataSize?: number) => {
  centralizedDebugCache.logCacheOperation(componentName, operation, cacheKey, dataSize);
};

// Global debug functions available in console
if (typeof window !== 'undefined') {
  (window as any).debugCache = {
    stats: () => centralizedDebugCache.getAllComponentStats(),
    apiLogs: (component?: string, limit = 20) => 
      component 
        ? centralizedDebugCache.getComponentApiLogs(component, limit)
        : centralizedDebugCache.getRecentApiLogs(limit),
    logoLogs: (component?: string, limit = 20) => 
      component 
        ? centralizedDebugCache.getComponentLogoLogs(component, limit)
        : centralizedDebugCache.getRecentLogoLogs(limit),
    summary: () => centralizedDebugCache.printSummary(),
    export: () => centralizedDebugCache.exportDebugData(),
    clear: () => centralizedDebugCache.clearAll(),
    hitRate: (component: string) => centralizedDebugCache.getCacheHitRate(component)
  };
}
