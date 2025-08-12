
class BackgroundPrefetcher {
  private prefetchQueue = new Set<string>();
  private prefetchingDates = new Set<string>();
  
  constructor() {
    this.initializeBackgroundPrefetch();
  }

  private async initializeBackgroundPrefetch() {
    // Pre-fetch today's data immediately on app load
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Queue critical dates for immediate prefetch
    this.queuePrefetch(today, 'high');
    this.queuePrefetch(tomorrow, 'high');
    this.queuePrefetch(yesterday, 'medium');

    // Start background prefetching
    this.startBackgroundPrefetch();
  }

  queuePrefetch(date: string, priority: 'high' | 'medium' | 'low' = 'medium') {
    if (this.prefetchingDates.has(date)) return;
    
    this.prefetchQueue.add(date);
    
    if (priority === 'high') {
      // High priority dates get prefetched immediately
      this.prefetchDate(date);
    }
  }

  private async startBackgroundPrefetch() {
    // Use requestIdleCallback for low-priority background work
    const prefetchInIdle = () => {
      if (this.prefetchQueue.size > 0) {
        const date = Array.from(this.prefetchQueue)[0];
        this.prefetchQueue.delete(date);
        this.prefetchDate(date);
      }

      // Continue prefetching when idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(prefetchInIdle, { timeout: 5000 });
      } else {
        setTimeout(prefetchInIdle, 2000);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchInIdle);
    } else {
      setTimeout(prefetchInIdle, 1000);
    }
  }

  private async prefetchDate(date: string) {
    if (this.prefetchingDates.has(date)) return;
    
    this.prefetchingDates.add(date);
    
    try {
      console.log(`🔄 [BackgroundPrefetch] Starting prefetch for ${date}`);
      
      // Try streaming endpoint first for faster initial response
      const streamResponse = await fetch(`/api/fixtures/date/${date}/stream?all=true`, {
        headers: { 'X-Prefetch': 'true' }
      });
      
      if (streamResponse.ok) {
        const reader = streamResponse.body?.getReader();
        const decoder = new TextDecoder();
        let allData = [];
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'cached' || parsed.type === 'fresh') {
                  allData = parsed.data;
                  // Store partial data immediately
                  const cacheKey = `fixtures-date-${date}-all`;
                  sessionStorage.setItem(cacheKey, JSON.stringify({
                    data: allData,
                    timestamp: Date.now(),
                    prefetched: true,
                    type: parsed.type
                  }));
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          }
        }
        
        console.log(`✅ [BackgroundPrefetch] Streamed ${allData.length} fixtures for ${date}`);
      } else {
        // Fallback to regular endpoint
        const response = await fetch(`/api/fixtures/date/${date}?all=true`, {
          headers: { 'X-Prefetch': 'true' }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [BackgroundPrefetch] Prefetched ${data.length} fixtures for ${date} (fallback)`);
          
          const cacheKey = `fixtures-date-${date}-all`;
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now(),
            prefetched: true
          }));
        }
      }
    } catch (error) {
      console.warn(`❌ [BackgroundPrefetch] Failed to prefetch ${date}:`, error);
    } finally {
      this.prefetchingDates.delete(date);
    }
  }

  // Pre-fetch dates around user interactions
  prefetchAroundDate(selectedDate: string) {
    const baseDate = new Date(selectedDate);
    
    // Prefetch ±3 days around selected date
    for (let i = -3; i <= 3; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toISOString().slice(0, 10);
      
      if (dateStr !== selectedDate) {
        this.queuePrefetch(dateStr, 'low');
      }
    }
  }
}

export const backgroundPrefetcher = new BackgroundPrefetcher();
