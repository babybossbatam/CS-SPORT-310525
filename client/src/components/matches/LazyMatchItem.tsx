import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyMatchItemProps {
  match: any;
  onMatchClick?: (fixture: any) => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
  flashStates?: {
    halftime: boolean;
    fulltime: boolean;
    goal: boolean;
  };
  leagueContext?: {
    name: string;
    country: string;
  };
}

// Global intersection observer for better performance
let globalObserver: IntersectionObserver | null = null;
let prefetchObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, () => void>();
const prefetchElements = new Map<Element, () => Promise<void>>();

const LazyMatchItem: React.FC<LazyMatchItemProps> = ({
  match,
  onMatchClick,
  isStarred,
  onToggleStar,
  flashStates,
  leagueContext,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  prefetchMargin = '300px',
  onPrefetch,
  priority = 'normal'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Initialize global observers
  useEffect(() => {
    if (!globalObserver) {
      globalObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const callback = observedElements.get(entry.target);
            if (callback && entry.isIntersecting) {
              callback();
            }
          });
        },
        { rootMargin, threshold }
      );
    }

    if (!prefetchObserver && onPrefetch) {
      prefetchObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const prefetchCallback = prefetchElements.get(entry.target);
            if (prefetchCallback && entry.isIntersecting) {
              prefetchCallback();
            }
          });
        },
        { rootMargin: prefetchMargin, threshold: 0.01 }
      );
    }
  }, [rootMargin, threshold, prefetchMargin, onPrefetch]);

  const handleVisible = useCallback(() => {
    if (!hasLoaded) {
      setIsVisible(true);
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (elementRef.current && globalObserver) {
      observedElements.delete(elementRef.current);
      globalObserver.unobserve(elementRef.current);
    }
    if (elementRef.current && prefetchObserver) {
      prefetchElements.delete(elementRef.current);
      prefetchObserver.unobserve(elementRef.current);
    }
  }, []);

  const handlePrefetch = useCallback(async () => {
    if (!isPrefetched && onPrefetch) {
      setIsPrefetched(true);
      try {
        await onPrefetch();
      } catch (error) {
        console.warn('Prefetch failed:', error);
        setIsPrefetched(false);
      }
    }
  }, [isPrefetched, onPrefetch]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !globalObserver) return;

    // Register for visibility detection
    observedElements.set(element, handleVisible);
    globalObserver.observe(element);

    // Register for prefetching if callback provided
    if (onPrefetch && prefetchObserver) {
      prefetchElements.set(element, handlePrefetch);
      prefetchObserver.observe(element);
    }

    return () => {
      if (element) {
        observedElements.delete(element);
        globalObserver?.unobserve(element);

        if (prefetchObserver) {
          prefetchElements.delete(element);
          prefetchObserver.unobserve(element);
        }
      }
    };
  }, [handleVisible, handlePrefetch, onPrefetch]);

  // 3-grid layout skeleton that matches the actual match card structure
  const defaultFallback = (
    <div className="country-matches-container">
      <div className="match-card-container">
        {/* Three-grid layout container */}
        <div className="match-three-grid-container">
          {/* Top grid for status */}
          <div className="match-status-top">
            <Skeleton className="h-4 w-16 rounded" />
          </div>

          {/* Middle grid for main content */}
          <div className="match-content-container">
            {/* Home Team Name */}
            <div className="home-team-name">
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Home team logo */}
            <div className="home-team-logo-container">
              <Skeleton className="h-8 w-8 rounded" />
            </div>

            {/* Score/Time Center */}
            <div className="match-score-container">
              <Skeleton className="h-6 w-12" />
            </div>

            {/* Away team logo */}
            <div className="away-team-logo-container">
              <Skeleton className="h-8 w-8 rounded" />
            </div>

            {/* Away Team Name */}
            <div className="away-team-name">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Bottom grid for penalty results */}
          <div className="match-penalty-bottom">
            {/* Empty or skeleton for additional info */}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={elementRef}
      style={{
        minHeight: priority === 'high' ? '80px' : '60px',
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
};

export default LazyMatchItem;