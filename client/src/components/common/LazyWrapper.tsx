import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
  threshold?: number;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <div>Loading...</div>,
  minHeight = "200px",
  threshold = 0.1
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} style={{ minHeight }}>
      {isVisible ? (
        <Suspense fallback={
          <div style={{ minHeight }} className="flex items-center justify-center">
            {fallback}
          </div>
        }>
          {children}
        </Suspense>
      ) : (
        <div style={{ minHeight }} className="flex items-center justify-center">
          {fallback}
        </div>
      )}
    </div>
  );
};

export default LazyWrapper;