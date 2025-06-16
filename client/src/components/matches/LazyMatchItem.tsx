
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyMatchItemProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  prefetchMargin?: string;
  onPrefetch?: () => Promise<void>;
  priority?: 'high' | 'normal' | 'low';
}

// Global intersection observer for better performance
let globalObserver: IntersectionObserver | null = null;
let prefetchObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, () => void>();
const prefetchElements = new Map<Element, () => Promise<void>>();

const LazyMatchItem: React.FC<LazyMatchItemProps> = ({
  children,
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

  const defaultFallback = (
    <div className="border rounded-lg p-4 animate-pulse bg-gray-50">
      <Skeleton className="h-4 w-32 mb-2" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-12" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
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
