import React from 'react';

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
  private readonly UPDATE_INTERVAL = 10000; // 10 seconds for faster live updates
  private readonly MIN_UPDATE_DELAY = 3000; // Minimum 3 seconds between updates
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
      try {
        // Create abort controller with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), 10000); // 10 second timeout

        // Add cache bypass for live matches
        const cacheBuster = `?t=${Date.now()}&bypass_cache=true`;

        const response = await fetch(`/api/fixtures/selective-updates${cacheBuster}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({ fixtureIds, bypassCache: true }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
        })).filter((update: any) => {
          // Only return updates that have meaningful data
          return update.fixtureId && update.status && update.status.short;
        });
      } catch (error) {
        clearTimeout(timeoutId);

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

// Hook for React components
export const useSelectiveMatchUpdate = (matchId: number, initialMatch: any) => {
  const [matchState, setMatchState] = React.useState({
    goals: initialMatch.goals,
    status: initialMatch.fixture.status
  });

  React.useEffect(() => {
    if (!matchId) return;

    console.log(`🎯 [SelectiveUpdate] Subscribing to match ${matchId}:`, {
      teams: `${initialMatch.teams?.home?.name} vs ${initialMatch.teams?.away?.name}`,
      initialStatus: initialMatch.fixture.status.short,
      initialGoals: `${initialMatch.goals.home}-${initialMatch.goals.away}`
    });

    // Subscribe to updates for this specific match
    const unsubscribe = selectiveMatchUpdater.subscribe(matchId, (updatedData) => {
      console.log(`🔄 [SelectiveUpdate] Received update for match ${matchId}:`, {
        teams: `${initialMatch.teams?.home?.name} vs ${initialMatch.teams?.away?.name}`,
        newStatus: updatedData.fixture?.status?.short,
        newGoals: updatedData.goals ? `${updatedData.goals.home}-${updatedData.goals.away}` : 'none',
        oldStatus: initialMatch.fixture.status.short,
        oldGoals: `${initialMatch.goals.home}-${initialMatch.goals.away}`,
        updatedData
      });

      setMatchState({
        goals: updatedData.goals || initialMatch.goals,
        status: updatedData.fixture?.status || initialMatch.fixture.status
      });
    });

    return unsubscribe;
  }, [matchId]);

  return matchState;
};