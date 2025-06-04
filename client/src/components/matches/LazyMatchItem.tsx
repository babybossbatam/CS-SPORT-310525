
import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyMatchItemProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

const LazyMatchItem: React.FC<LazyMatchItemProps> = ({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          // Once loaded, we can disconnect the observer
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, rootMargin, threshold]);

  const defaultFallback = (
    <div className="border rounded-lg p-4 animate-pulse">
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
    <div ref={elementRef}>
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
};

export default LazyMatchItem;
