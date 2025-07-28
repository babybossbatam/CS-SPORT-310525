
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface PopularLeague {
  id: number;
  name: string;
  logo: string;
  country: string;
  popularity: number;
  priority: number;
  flag?: string;
  type: string;
  season: number;
}

interface UsePopularLeaguesReturn {
  leagues: PopularLeague[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePopularLeagues(): UsePopularLeaguesReturn {
  const [leagues, setLeagues] = useState<PopularLeague[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularLeagues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🏆 [usePopularLeagues] Fetching popular leagues...');
      
      const response = await apiRequest('GET', '/api/popular-leagues');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch popular leagues`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array');
      }
      
      console.log(`✅ [usePopularLeagues] Successfully fetched ${data.length} leagues`);
      setLeagues(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ [usePopularLeagues] Error:', errorMessage);
      setError(errorMessage);
      
      // Fallback to cached data if available
      const cachedData = localStorage.getItem('popular-leagues-cache');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (cacheAge < maxAge && Array.isArray(parsed.data)) {
            console.log('📦 [usePopularLeagues] Using cached fallback data');
            setLeagues(parsed.data);
            setError(null);
          }
        } catch (cacheError) {
          console.error('❌ [usePopularLeagues] Cache parse error:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularLeagues();
  }, []);

  // Cache successful results
  useEffect(() => {
    if (leagues.length > 0 && !error) {
      const cacheData = {
        data: leagues,
        timestamp: Date.now()
      };
      localStorage.setItem('popular-leagues-cache', JSON.stringify(cacheData));
    }
  }, [leagues, error]);

  return {
    leagues,
    isLoading,
    error,
    refetch: fetchPopularLeagues
  };
}
