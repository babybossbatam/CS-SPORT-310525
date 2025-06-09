
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  centralizedDebugCache, 
  ComponentCacheStats, 
  ApiDebugInfo, 
  LogoDebugInfo 
} from '@/lib/centralizedDebugCache';
import { enhancedApiWrapper } from '@/lib/enhancedApiWrapper';
import { enhancedLogoManager } from '@/lib/enhancedLogoManager';

interface UnifiedDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const UnifiedDebugPanel: React.FC<UnifiedDebugPanelProps> = ({
  isVisible,
  onClose
}) => {
  const [componentStats, setComponentStats] = useState<ComponentCacheStats[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiDebugInfo[]>([]);
  const [logoLogs, setLogoLogs] = useState<LogoDebugInfo[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Initial load
      refreshData();
      
      // Set up auto-refresh
      const interval = setInterval(refreshData, 2000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isVisible]);

  const refreshData = () => {
    setComponentStats(centralizedDebugCache.getAllComponentStats());
    setApiLogs(centralizedDebugCache.getRecentApiLogs(100));
    setLogoLogs(centralizedDebugCache.getRecentLogoLogs(100));
  };

  const clearAllData = () => {
    centralizedDebugCache.clearAll();
    enhancedApiWrapper.clearCache();
    enhancedLogoManager.clearCache();
    refreshData();
  };

  const exportDebugData = () => {
    const data = centralizedDebugCache.exportDebugData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  const summary = centralizedDebugCache.exportDebugData().summary;
  const apiCacheStats = enhancedApiWrapper.getCacheStats();
  const logoCacheStats = enhancedLogoManager.getCacheStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-5/6 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Unified Debug Panel</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportDebugData}>
              Export Data
            </Button>
            <Button size="sm" variant="outline" onClick={clearAllData}>
              Clear All
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 m-4 mb-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="api-logs">API Logs</TabsTrigger>
              <TabsTrigger value="logo-logs">Logo Logs</TabsTrigger>
              <TabsTrigger value="cache-stats">Cache Stats</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-4">
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{summary.totalApiCalls}</div>
                      <div className="text-sm text-gray-600">Total API Calls</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{summary.averageHitRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Avg Hit Rate</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">{summary.totalLogoLoads}</div>
                      <div className="text-sm text-gray-600">Logo Loads</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">{summary.totalFallbacks}</div>
                      <div className="text-sm text-gray-600">Fallbacks Used</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">Component Performance</h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {componentStats.slice(0, 6).map(comp => (
                          <div key={comp.componentName} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{comp.componentName.replace('New', '')}</span>
                            <div className="flex gap-2">
                              <Badge variant="secondary">
                                {centralizedDebugCache.getCacheHitRate(comp.componentName).toFixed(0)}%
                              </Badge>
                              <Badge variant="outline">
                                {comp.apiCalls} calls
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">Recent Activity</h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {apiLogs.slice(0, 8).map((log, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="truncate">{log.endpoint.split('/').pop()}</span>
                            <div className="flex gap-2">
                              <Badge 
                                variant={log.status === 'success' ? 'default' : 
                                        log.status === 'cached' ? 'secondary' : 'destructive'}
                              >
                                {log.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {log.responseTime}ms
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="components" className="mt-0">
                <div className="space-y-4">
                  {componentStats.map(comp => (
                    <Card key={comp.componentName}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">{comp.componentName}</h4>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {centralizedDebugCache.getCacheHitRate(comp.componentName).toFixed(1)}% Hit Rate
                            </Badge>
                            <Badge variant="outline">
                              {comp.apiCalls} API Calls
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Cache Hits:</span>
                            <div className="text-green-600">{comp.cacheHits}</div>
                          </div>
                          <div>
                            <span className="font-medium">Cache Misses:</span>
                            <div className="text-orange-600">{comp.cacheMisses}</div>
                          </div>
                          <div>
                            <span className="font-medium">Errors:</span>
                            <div className="text-red-600">{comp.errors.length}</div>
                          </div>
                          <div>
                            <span className="font-medium">Last Updated:</span>
                            <div className="text-gray-600">
                              {new Date(comp.lastUpdated).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        {comp.errors.length > 0 && (
                          <div className="mt-4">
                            <span className="font-medium text-red-600">Recent Errors:</span>
                            <div className="mt-2 space-y-1">
                              {comp.errors.slice(-3).map((error, index) => (
                                <div key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                                  {error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="api-logs" className="mt-0">
                <div className="space-y-2">
                  {apiLogs.map((log, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={log.status === 'success' ? 'default' : 
                                        log.status === 'cached' ? 'secondary' : 'destructive'}
                              >
                                {log.status}
                              </Badge>
                              <span className="font-mono text-sm">{log.method}</span>
                              <span className="text-sm font-medium">{log.endpoint}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(log.timestamp).toLocaleString()}
                              {log.cacheKey && <span className="ml-2">Cache: {log.cacheKey}</span>}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div>{log.responseTime}ms</div>
                            {log.dataSize && (
                              <div className="text-xs text-gray-500">
                                {(log.dataSize / 1024).toFixed(1)}KB
                              </div>
                            )}
                          </div>
                        </div>
                        {log.error && (
                          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                            {log.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="logo-logs" className="mt-0">
                <div className="space-y-2">
                  {logoLogs.map((log, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{log.type}</Badge>
                              <Badge variant="secondary">{log.shape}</Badge>
                              <span className="text-sm font-medium">{log.component}</span>
                              {log.fallbackUsed && (
                                <Badge variant="destructive">Fallback</Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {log.url}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.teamId && `Team: ${log.teamId}`}
                              {log.country && `Country: ${log.country}`}
                              {log.leagueId && `League: ${log.leagueId}`}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div>{log.loadTime}ms</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cache-stats" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">API Cache Statistics</h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Entries:</span>
                          <span className="font-medium">{apiCacheStats.totalEntries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Size:</span>
                          <span className="font-medium">
                            {(apiCacheStats.totalSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <Separator />
                        <div className="space-y-1 max-h-40 overflow-auto">
                          {apiCacheStats.entries.slice(0, 10).map((entry, index) => (
                            <div key={index} className="text-xs">
                              <div className="flex justify-between">
                                <span className="truncate">{entry.key}</span>
                                <span>{(entry.size / 1024).toFixed(1)}KB</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">Logo Cache Statistics</h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Entries:</span>
                          <span className="font-medium">{logoCacheStats.totalEntries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Team Logos:</span>
                          <span className="font-medium">{logoCacheStats.teamLogos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Country Flags:</span>
                          <span className="font-medium">{logoCacheStats.flags}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>League Logos:</span>
                          <span className="font-medium">{logoCacheStats.leagues}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fallbacks Used:</span>
                          <span className="font-medium text-orange-600">{logoCacheStats.fallbackCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
