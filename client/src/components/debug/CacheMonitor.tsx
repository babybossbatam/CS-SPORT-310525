
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CacheManager } from '@/lib/cachingHelper';
import { Database, RefreshCw, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface CacheEntry {
  queryKey: string;
  dataUpdatedAt: number | null;
  isFresh: boolean;
  age: number;
  status: string;
}

const CacheMonitor: React.FC = () => {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const updateCacheEntries = () => {
    const stats = CacheManager.getCacheStats();
    const cache = (window as any).__REACT_QUERY_CLIENT__?.getQueryCache?.() || 
                 (window as any).queryClient?.getQueryCache?.();
    
    if (cache) {
      const queries = cache.getAll();
      const entries: CacheEntry[] = queries.map((query: any) => {
        const queryKey = query.queryKey.join('-');
        const dataUpdatedAt = query.state.dataUpdatedAt;
        const age = dataUpdatedAt ? Date.now() - dataUpdatedAt : 0;
        const isFresh = age < 30 * 60 * 1000; // 30 minutes
        
        return {
          queryKey,
          dataUpdatedAt,
          isFresh,
          age,
          status: query.state.status
        };
      });
      
      setCacheEntries(entries.sort((a, b) => (b.dataUpdatedAt || 0) - (a.dataUpdatedAt || 0)));
    }
  };

  useEffect(() => {
    if (isVisible) {
      updateCacheEntries();
      const interval = setInterval(updateCacheEntries, 2000);
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isVisible]);

  const formatAge = (age: number) => {
    const minutes = Math.floor(age / 60000);
    const seconds = Math.floor((age % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const clearAllCache = () => {
    const cache = (window as any).__REACT_QUERY_CLIENT__?.getQueryCache?.() || 
                 (window as any).queryClient?.getQueryCache?.();
    if (cache) {
      cache.clear();
      updateCacheEntries();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache Monitor
              <Badge variant="outline" className="text-xs">
                {cacheEntries.length} queries
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                onClick={updateCacheEntries}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                onClick={clearAllCache}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500"
              >
                🗑️
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 max-h-72 overflow-y-auto">
          <div className="space-y-1 text-xs">
            {cacheEntries.map((entry, index) => (
              <div
                key={index}
                className={`p-2 rounded border ${
                  entry.isFresh ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {entry.isFresh ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    )}
                    <span className="font-medium truncate max-w-40">
                      {entry.queryKey}
                    </span>
                  </div>
                  <Badge
                    variant={entry.status === 'success' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {entry.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {entry.dataUpdatedAt ? formatAge(entry.age) : 'No data'}
                  </div>
                  {entry.dataUpdatedAt && (
                    <span>
                      {format(new Date(entry.dataUpdatedAt), 'HH:mm:ss')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {cacheEntries.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No cache entries found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheMonitor;
