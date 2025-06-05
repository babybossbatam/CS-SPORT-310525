
export const createDeferredLoader = <T>(
  loadFn: () => Promise<T>,
  delay: number = 100
): (() => Promise<T>) => {
  let cached: Promise<T> | null = null;
  
  return () => {
    if (cached) return cached;
    
    cached = new Promise((resolve, reject) => {
      setTimeout(() => {
        loadFn().then(resolve).catch(reject);
      }, delay);
    });
    
    return cached;
  };
};

export const createBatchedLoader = <T>(
  requests: (() => Promise<T>)[],
  batchSize: number = 3
): Promise<T[]> => {
  const batches: (() => Promise<T>)[][] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    batches.push(requests.slice(i, i + batchSize));
  }
  
  return batches.reduce(async (prev, batch) => {
    const results = await prev;
    const batchResults = await Promise.allSettled(
      batch.map(fn => fn())
    );
    
    return [
      ...results,
      ...batchResults
        .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
        .map(result => result.value)
    ];
  }, Promise.resolve([] as T[]));
};

export const createIntersectionLoader = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  if (typeof window === 'undefined') return () => {};
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, { rootMargin: '50px', ...options });
  
  return (element: Element | null) => {
    if (element) observer.observe(element);
  };
};

export const optimizeImageLoading = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const debounceAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        fn(...args).then(resolve).catch(reject);
      }, delay);
    });
  }) as T;
};
