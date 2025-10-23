import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInactivityTimeoutOptions {
  timeoutMs?: number;
  onInactive?: () => void;
  onActive?: () => void;
  enableLogging?: boolean;
}

export const useInactivityTimeout = (options: UseInactivityTimeoutOptions = {}) => {
  const {
    timeoutMs = 30 * 60 * 1000, // 30 minutes default
    onInactive,
    onActive,
    enableLogging = true,
  } = options;

  const [isInactive, setIsInactive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isInactive) {
      setIsInactive(false);
      if (enableLogging) {
        console.log('✅ [InactivityMonitor] User active again - resuming data fetching');
      }
      onActive?.();
    }

    lastActivityRef.current = now;

    timeoutRef.current = setTimeout(() => {
      setIsInactive(true);
      if (enableLogging) {
        console.log('⏸️ [InactivityMonitor] User inactive for 30 minutes - pausing data fetching to prevent memory buildup');
      }
      onInactive?.();
    }, timeoutMs);
  }, [isInactive, timeoutMs, onInactive, onActive, enableLogging]);

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    let throttleTimeout: NodeJS.Timeout | null = null;
    
    const handleActivity = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        resetInactivityTimer();
        throttleTimeout = null;
      }, 1000);
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [resetInactivityTimer]);

  return {
    isInactive,
    resetTimer: resetInactivityTimer,
    getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
  };
};
