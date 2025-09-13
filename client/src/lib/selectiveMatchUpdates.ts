import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Selective Match Updates System
 * Only updates specific fields (scores, status, elapsed time) without full component re-renders
 */

interface SelectiveMatchUpdate {
  fixtureId: number;
  goals: {
    home: number | null;
    away: number | null;
  };
  status: {
    short: string;
    elapsed?: number;
  };
  timestamp: number;
}

interface MatchUpdateSubscriber {
  fixtureId: number;
  callback: (update: SelectiveMatchUpdate) => void;
}

class SelectiveMatchUpdater {
  private subscribers: Map<number, MatchUpdateSubscriber[]> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 15000; // 15 seconds
  private readonly MIN_UPDATE_DELAY = 5000; // Minimum 5 seconds between updates
  private isOnline = true;

  constructor() {
    // Monitor online status
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('🌐 [SelectiveUpdater] Connection restored');
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      console.log('🔌 [SelectiveUpdater] Connection lost');
      this.isOnline = false;
    });
  }

  /**
   * Subscribe to updates for a specific match
   */
  subscribe(fixtureId: number, callback: (update: SelectiveMatchUpdate) => void): () => void {
    if (!this.subscribers.has(fixtureId)) {
      this.subscribers.set(fixtureId, []);
    }

    const subscriber: MatchUpdateSubscriber = { fixtureId, callback };
    this.subscribers.get(fixtureId)!.push(subscriber);

    // Start updating if this is the first subscription
    if (this.getTotalSubscriptions() === 1) {
      this.startUpdating();
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(fixtureId);
      if (subs) {
        const index = subs.indexOf(subscriber);
        if (index > -1) {
          subs.splice(index, 1);
        }

        // Clean up empty arrays
        if (subs.length === 0) {
          this.subscribers.delete(fixtureId);
        }
      }

      // Stop updating if no more subscriptions
      if (this.getTotalSubscriptions() === 0) {
        this.stopUpdating();
      }
    };
  }

  /**
   * Get total number of active subscriptions
   */
  private getTotalSubscriptions(): number {
    let total = 0;
    for (const subs of this.subscribers.values()) {
      total += subs.length;
    }
    return total;
  }

  /**
   * Start the update cycle
   */
  private startUpdating(): void {
    if (this.updateInterval) return;

    console.log(`🔄 [SelectiveUpdater] Starting selective updates for ${this.getTotalSubscriptions()} subscriptions`);

    this.updateInterval = setInterval(() => {
      this.performUpdate();
    }, this.UPDATE_INTERVAL);

    // Perform initial update
    this.performUpdate();
  }

  /**
   * Stop the update cycle
   */
  private stopUpdating(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 [SelectiveUpdater] Stopped selective updates');
    }
  }

  /**
   * Perform the actual update
   */
  private async performUpdate(): Promise<void> {
    if (this.isUpdating) {
      console.log('⏭️ [SelectiveUpdater] Update already in progress, skipping');
      return;
    }

    if (!this.isOnline) {
      console.log('🔌 [SelectiveUpdater] Device is offline, skipping update');
      return;
    }

    const now = Date.now();
    if (now - this.lastUpdateTime < this.MIN_UPDATE_DELAY) {
      console.log('⏭️ [SelectiveUpdater] Too soon since last update, skipping');
      return;
    }

    const subscribedFixtureIds = Array.from(this.subscribers.keys());
    if (subscribedFixtureIds.length === 0) {
      return;
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;

    try {
      console.log(`🎯 [SelectiveUpdater] Fetching updates for ${subscribedFixtureIds.length} matches`);

      const updates = await this.fetchSelectiveUpdates(subscribedFixtureIds);

      if (updates.length > 0) {
        console.log(`✅ [SelectiveUpdater] Received ${updates.length} updates`);
        this.distributeUpdates(updates);
      } else {
        console.log('📭 [SelectiveUpdater] No updates received');
      }
    } catch (error) {
      console.warn('❌ [SelectiveUpdater] Update failed:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Fetch selective updates from API with retry logic and connection checks
   */
  private async fetchSelectiveUpdates(fixtureIds: number[]): Promise<SelectiveMatchUpdate[]> {
    // Check if online before making request
    if (!navigator.onLine) {
      console.log('🔌 [SelectiveUpdater] Device is offline, skipping update');
      return [];
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        // Create abort controller with timeout
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort('timeout'), 10000); // 10 second timeout

        const response = await fetch('/api/fixtures/selective-updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fixtureIds }),
          signal: controller.signal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.map((item: any) => ({
          fixtureId: item.fixture.id,
          goals: {
            home: item.goals.home,
            away: item.goals.away,
          },
          status: {
            short: item.fixture.status.short,
            elapsed: item.fixture.status.elapsed,
          },
          timestamp: Date.now(),
        }));
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Handle specific error types
        if (error instanceof Error && error.name === 'AbortError') {
          if (error.message === 'timeout') {
            console.warn(`⏱️ [SelectiveUpdater] Request timeout on attempt ${attempt}/${maxRetries}`);
          } else {
            console.warn(`⏱️ [SelectiveUpdater] Request aborted on attempt ${attempt}/${maxRetries} with reason: ${error.message}`);
          }
        } else if (errorMessage.includes('ERR_TUNNEL_CONNECTION_FAILED') || 
                   errorMessage.includes('Failed to fetch') ||
                   errorMessage.includes('NetworkError')) {
          console.warn(`🌐 [SelectiveUpdater] Network error on attempt ${attempt}/${maxRetries}: ${errorMessage}`);

          // Try to trigger network recovery
          try {
            await this.attemptNetworkRecovery();
          } catch (recoveryError) {
            console.warn('⚠️ [SelectiveUpdater] Network recovery failed:', recoveryError);
          }
        } else {
          console.error(`❌ [SelectiveUpdater] API error on attempt ${attempt}/${maxRetries}:`, error);
        }

        // If this is the last attempt, return empty array
        if (attempt === maxRetries) {
          console.error('💥 [SelectiveUpdater] All retry attempts failed, returning empty updates');
          return [];
        }

        // Wait before retrying (exponential backoff)
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return [];
  }

  /**
   * Distribute updates to subscribers
   */
  private distributeUpdates(updates: SelectiveMatchUpdate[]): void {
    updates.forEach(update => {
      const subscribers = this.subscribers.get(update.fixtureId);
      if (subscribers) {
        subscribers.forEach(subscriber => {
          try {
            subscriber.callback(update);
          } catch (error) {
            console.error(`Error in subscriber callback for fixture ${update.fixtureId}:`, error);
          }
        });
      }
    });
  }

  /**
   * Get current subscriber count for debugging
   */
  getSubscriberCount(): number {
    return this.getTotalSubscriptions();
  }

  /**
   * Get subscribed fixture IDs
   */
  getSubscribedFixtures(): number[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Attempt network recovery by making a simple health check
   */
  private async attemptNetworkRecovery(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ [SelectiveUpdater] Network recovery successful');
      }
    } catch (error) {
      console.warn('🌐 [SelectiveUpdater] Network recovery failed, will retry later');
      throw error;
    }
  }
}

// Export singleton instance
export const selectiveMatchUpdater = new SelectiveMatchUpdater();

// Hook for React components - completely avoids React state to prevent queue issues
export const useSelectiveMatchUpdate = (matchId: number, initialMatch: any) => {
  // Use refs exclusively to avoid React's state queue
  const matchStateRef = useRef({
    goals: initialMatch.goals,
    status: initialMatch.fixture.status
  });
  
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const updateCallbacksRef = useRef<Set<() => void>>(new Set());

  // Register an update callback without using React state
  const registerUpdateCallback = useCallback((callback: () => void) => {
    updateCallbacksRef.current.add(callback);
    return () => {
      updateCallbacksRef.current.delete(callback);
    };
  }, []);

  // Trigger updates without React state
  const triggerUpdate = useCallback(() => {
    if (isMountedRef.current && updateCallbacksRef.current.size > 0) {
      try {
        const now = Date.now();
        // Throttle updates to prevent excessive re-renders
        if (now - lastUpdateRef.current > 100) {
          lastUpdateRef.current = now;
          updateCallbacksRef.current.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.warn(`⚠️ [SelectiveUpdate] Update callback error for match ${matchId}:`, error);
            }
          });
        }
      } catch (error) {
        console.warn(`⚠️ [SelectiveUpdate] Failed to trigger update for match ${matchId}:`, error);
      }
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    console.log(`🎯 [SelectiveUpdate] Subscribing to match ${matchId}:`, {
      teams: `${initialMatch.teams?.home?.name} vs ${initialMatch.teams?.away?.name}`,
      initialStatus: initialMatch.fixture.status.short,
      initialGoals: `${initialMatch.goals.home}-${initialMatch.goals.away}`
    });

    // Subscribe to updates for this specific match
    const unsubscribe = selectiveMatchUpdater.subscribe(matchId, (updatedData) => {
      // Only update if component is still mounted
      if (!isMountedRef.current) {
        console.log(`🚫 [SelectiveUpdate] Skipping update for unmounted component (match ${matchId})`);
        return;
      }

      try {
        console.log(`🔄 [SelectiveUpdate] Received update for match ${matchId}:`, {
          teams: `${initialMatch.teams?.home?.name} vs ${initialMatch.teams?.away?.name}`,
          newStatus: updatedData.status?.short,
          newGoals: updatedData.goals ? `${updatedData.goals.home}-${updatedData.goals.away}` : 'none',
          oldStatus: matchStateRef.current.status.short,
          oldGoals: `${matchStateRef.current.goals.home}-${matchStateRef.current.goals.away}`,
          updatedData
        });

        // Update ref directly to avoid React state queue
        const hasChanges = (
          updatedData.goals && (
            updatedData.goals.home !== matchStateRef.current.goals.home ||
            updatedData.goals.away !== matchStateRef.current.goals.away
          )
        ) || (
          updatedData.status && updatedData.status.short !== matchStateRef.current.status.short
        );

        if (hasChanges) {
          matchStateRef.current = {
            goals: updatedData.goals || matchStateRef.current.goals,
            status: updatedData.status || matchStateRef.current.status
          };

          // Use requestAnimationFrame for smoother updates
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              triggerUpdate();
            }
          });
        }
      } catch (error) {
        console.warn(`⚠️ [SelectiveUpdate] Error updating match ${matchId}:`, error);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        } catch (error) {
          console.warn(`⚠️ [SelectiveUpdate] Error during cleanup for match ${matchId}:`, error);
        }
      }
      updateCallbacksRef.current.clear();
    };
  }, [matchId, triggerUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      updateCallbacksRef.current.clear();
    };
  }, []);

  // Return state getter and update registration function
  return {
    getState: () => matchStateRef.current,
    registerUpdateCallback
  };
};

// Export the SelectiveMatchUpdater class for direct access
export { SelectiveMatchUpdater };</old_str>
</old_str>