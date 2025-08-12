
import React, { useEffect, useRef, useCallback } from 'react';
import { usePaginatedFixtures } from '../../hooks/usePaginatedFixtures';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import BrandedLoading from '../common/BrandedLoading';

interface PaginatedFixturesListProps {
  date: string;
  all?: boolean;
  limit?: number;
  className?: string;
}

const PaginatedFixturesList: React.FC<PaginatedFixturesListProps> = ({
  date,
  all = false,
  limit = 50,
  className = ''
}) => {
  const {
    fixtures,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    canLoadMore
  } = usePaginatedFixtures({ date, all, limit });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && canLoadMore) {
      console.log('📄 [PaginatedFixtures] Loading more fixtures...');
      fetchNextPage();
    }
  }, [canLoadMore, fetchNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <BrandedLoading />
        <span className="ml-2 text-sm text-gray-500">Loading fixtures...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <p className="text-red-600 mb-3">Failed to load fixtures</p>
          <p className="text-sm text-red-500 mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with count */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Fixtures for {date}
        </h3>
        <div className="text-sm text-gray-500">
          Showing {fixtures.length} of {totalCount} total
        </div>
      </div>

      {/* Fixtures List */}
      <div className="space-y-2">
        {fixtures.map((fixture, index) => (
          <Card key={`${fixture.fixture.id}-${index}`} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <img 
                    src={fixture.teams.home.logo} 
                    alt={fixture.teams.home.name}
                    className="w-6 h-6"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/fallback-logo.png';
                    }}
                  />
                  <span className="font-medium">{fixture.teams.home.name}</span>
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {fixture.goals.home} - {fixture.goals.away}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fixture.fixture.status.short}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{fixture.teams.away.name}</span>
                  <img 
                    src={fixture.teams.away.logo} 
                    alt={fixture.teams.away.name}
                    className="w-6 h-6"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/fallback-logo.png';
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-400 text-center">
                {fixture.league.name} • {new Date(fixture.fixture.date).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-4">
          {isFetchingNextPage ? (
            <div className="flex justify-center items-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading more fixtures...</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button 
                onClick={() => fetchNextPage()}
                variant="outline"
                size="sm"
                disabled={!canLoadMore}
              >
                Load More Fixtures
              </Button>
            </div>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasNextPage && fixtures.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          All fixtures loaded ({totalCount} total)
        </div>
      )}

      {/* Empty state */}
      {fixtures.length === 0 && !isLoading && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-2">No fixtures found for {date}</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaginatedFixturesList;
