
import { useState, useEffect, useRef } from 'react';

interface LiveMatchUpdatesOptions {
  matchId: number;
  isLive: boolean;
  baseInterval?: number;
}

export const useLiveMatchUpdates = ({ 
  matchId, 
  isLive, 
  baseInterval = 10000 
}: LiveMatchUpdatesOptions) => {
  const [matchData, setMatchData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Adaptive polling: faster during active periods
    const getAdaptiveInterval = () => {
      const timeSinceLastUpdate = Date.now() - lastUpdate;
      
      // If recent activity, poll faster
      if (timeSinceLastUpdate < 2 * 60 * 1000) { // 2 minutes
        return 5000; // 5 seconds
      }
      
      return baseInterval; // 10 seconds default
    };

    const fetchLiveData = async () => {
      try {
        const response = await fetch(`/api/fixtures/${matchId}`);
        const data = await response.json();
        
        if (data) {
          const hasChanged = JSON.stringify(data) !== JSON.stringify(matchData);
          if (hasChanged) {
            setMatchData(data);
            setLastUpdate(Date.now());
          }
        }
      } catch (error) {
        console.error('Error fetching live match data:', error);
      }
    };

    // Initial fetch
    fetchLiveData();

    // Set up adaptive interval
    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        fetchLiveData();
        setupInterval(); // Readjust interval based on activity
      }, getAdaptiveInterval());
    };

    setupInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchId, isLive, baseInterval, matchData, lastUpdate]);

  return { matchData, lastUpdate };
};
