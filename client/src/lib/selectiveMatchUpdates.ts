
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
  private readonly UPDATE_INTERVAL = 15000; // 15 seconds
  private readonly MIN_UPDATE_DELAY = 5000; // Minimum 5 seconds between updates

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
        console.log('📭 [SelectiveUpdater] No updates received - API may be temporarily unavailable');
      }
    } catch (error) {
      console.warn('❌ [SelectiveUpdater] Update failed, will retry on next cycle:', error);
      
      // If the selective updates are consistently failing, increase interval to reduce load
      if (this.UPDATE_INTERVAL < 30000) {
        console.log('🔄 [SelectiveUpdater] Temporarily increasing update interval due to failures');
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Fetch selective updates from API
   */
  private async fetchSelectiveUpdates(fixtureIds: number[]): Promise<SelectiveMatchUpdate[]> {
    const maxRetries = 2;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('/api/fixtures/selective-updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fixtureIds }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected array');
        }

        return data.map((item: any) => ({
          fixtureId: item.fixture?.id || 0,
          goals: {
            home: item.goals?.home ?? null,
            away: item.goals?.away ?? null,
          },
          status: {
            short: item.fixture?.status?.short || 'NS',
            elapsed: item.fixture?.status?.elapsed || null,
          },
          timestamp: Date.now(),
        }));
      } catch (error) {
        retryCount++;
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`🕒 [SelectiveUpdater] Request timeout (attempt ${retryCount}/${maxRetries + 1})`);
          } else if (error.message.includes('Failed to fetch')) {
            console.warn(`🌐 [SelectiveUpdater] Network error (attempt ${retryCount}/${maxRetries + 1}):`, error.message);
          } else {
            console.warn(`❌ [SelectiveUpdater] API error (attempt ${retryCount}/${maxRetries + 1}):`, error.message);
          }
        }

        if (retryCount <= maxRetries) {
          // Wait before retrying: 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }
    }

    console.error('❌ [SelectiveUpdater] All retry attempts failed, returning empty array');
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
}

// Export singleton instance
export const selectiveMatchUpdater = new SelectiveMatchUpdater();

// Hook for React components
export const useSelectiveMatchUpdate = (
  fixtureId: number,
  initialMatch: {
    goals: { home: number | null; away: number | null };
    fixture: { status: { short: string; elapsed?: number } };
  }
) => {
  const [matchState, setMatchState] = React.useState({
    goals: initialMatch.goals,
    status: initialMatch.fixture.status,
    lastUpdated: Date.now(),
  });

  React.useEffect(() => {
    const unsubscribe = selectiveMatchUpdater.subscribe(fixtureId, (update) => {
      setMatchState(prev => {
        // Only update if data actually changed
        const goalsChanged = 
          prev.goals.home !== update.goals.home || 
          prev.goals.away !== update.goals.away;
        const statusChanged = 
          prev.status.short !== update.status.short || 
          prev.status.elapsed !== update.status.elapsed;

        if (goalsChanged || statusChanged) {
          console.log(`🔄 [useSelectiveMatchUpdate] Updating fixture ${fixtureId}:`, {
            oldGoals: prev.goals,
            newGoals: update.goals,
            oldStatus: prev.status,
            newStatus: update.status,
          });

          return {
            goals: update.goals,
            status: update.status,
            lastUpdated: update.timestamp,
          };
        }

        return prev;
      });
    });

    return unsubscribe;
  }, [fixtureId]);

  return matchState;
};
