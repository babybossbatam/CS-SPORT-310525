
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

interface PaginatedFixturesResponse {
  fixtures: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

interface UsePaginatedFixturesOptions {
  date: string;
  all?: boolean;
  limit?: number;
  enabled?: boolean;
}

export const usePaginatedFixtures = ({
  date,
  all = false,
  limit = 50,
  enabled = true
}: UsePaginatedFixturesOptions) => {
  const queryKey = ['fixtures-paginated', date, all, limit];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
        ...(all && { all: 'true' })
      });

      const response = await fetch(`/api/fixtures/date/${date}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(result)) {
        // Non-paginated response (backward compatibility)
        return {
          fixtures: result,
          pagination: {
            page: 1,
            limit: result.length,
            total: result.length,
            hasMore: false,
            totalPages: 1
          }
        };
      }
      
      return result as PaginatedFixturesResponse;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into a single array
  const allFixtures = data?.pages.flatMap(page => page.fixtures) || [];
  const totalCount = data?.pages[0]?.pagination.total || 0;

  return {
    fixtures: allFixtures,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    canLoadMore: hasNextPage && !isFetchingNextPage
  };
};

// Hook for non-infinite scroll usage (traditional pagination)
export const usePaginatedFixturesPage = ({
  date,
  all = false,
  limit = 50,
  page = 1,
  enabled = true
}: UsePaginatedFixturesOptions & { page?: number }) => {
  const queryKey = ['fixtures-page', date, all, limit, page];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(all && { all: 'true' })
      });

      const response = await fetch(`/api/fixtures/date/${date}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(result)) {
        return {
          fixtures: result,
          pagination: {
            page: 1,
            limit: result.length,
            total: result.length,
            hasMore: false,
            totalPages: 1
          }
        };
      }
      
      return result as PaginatedFixturesResponse;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
