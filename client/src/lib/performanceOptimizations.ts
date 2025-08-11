
// Performance optimization utilities for TodaysMatchesByCountryNew

export const useDebounceCallback = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

export const useThrottleCallback = (callback: Function, limit: number) => {
  const lastRan = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    if (Date.now() - lastRan.current >= limit) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }, [callback, limit]);
};

// Batch DOM updates
export const batchDOMUpdates = (callback: Function) => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => callback());
  } else {
    requestAnimationFrame(() => callback());
  }
};

// Memory-efficient country processing
export const processCountriesInBatches = (countries: string[], batchSize: number = 10) => {
  const batches: string[][] = [];
  for (let i = 0; i < countries.length; i += batchSize) {
    batches.push(countries.slice(i, i + batchSize));
  }
  return batches;
};
