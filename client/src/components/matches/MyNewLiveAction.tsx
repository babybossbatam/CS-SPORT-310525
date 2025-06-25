import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import '../../styles/liveaction.css';

interface MyNewLiveActionProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
}

interface SportsradarEvent {
  id: string;
  time: {
    minute: number;
    second?: number;
  };
  type: 'goal' | 'card' | 'substitution' | 'corner' | 'foul' | 'shot' | 'save' | 'offside';
  team: 'home' | 'away';
  player?: {
    name: string;
    id: string;
  };
  description: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

interface LiveStats {
  possession: {
    home: number;
    away: number;
  };
  shots: {
    home: number;
    away: number;
  };
  shotsOnTarget?: {
    home: number;
    away: number;
  };
  corners: {
    home: number;
    away: number;
  };
  fouls: {
    home: number;
    away: number;
  };
}

const MyNewLiveAction: React.FC<MyNewLiveActionProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "" 
}) => {
  const [liveEvents, setLiveEvents] = useState<SportsradarEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SportsradarEvent | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [lastAction, setLastAction] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Memoize the live status check to prevent unnecessary re-renders
  const isLive = useMemo(() => {
    return status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);
  }, [status]);

  // Memoize team data to prevent unnecessary re-renders
  const homeTeamData = useMemo(() => homeTeam, [homeTeam]);
  const awayTeamData = useMemo(() => awayTeam, [awayTeam]);

  // Fetch Sportsradar data with proper error handling and cleanup
  const fetchSportsradarData = useCallback(async () => {
    if (!matchId || !isLive) {
      console.log('❌ [Sportsradar Live Action] No match ID or match not live');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setIsLoading(true);
      setError(null);

      // Set a reasonable timeout
      timeoutId = setTimeout(() => {
        if (isMounted && !controller.signal.aborted) {
          try {
            controller.abort();
            console.warn('⏰ [Sportsradar] Request timeout');
            if (isMounted) {
              setError('Request timeout');
              setIsLoading(false);
            }
          } catch (abortError) {
            console.warn('⚠️ [Sportsradar] Error during abort:', abortError);
          }
        }
      }, 8000);

      let hasEvents = false;
      let hasStats = false;

      // Try Sportsradar API first
      try {
        const eventsResponse = await fetch(`/api/sportsradar/fixtures/${matchId}/events`, {
          signal: controller.signal
        });

        if (eventsResponse.ok && isMounted) {
          const eventsData = await eventsResponse.json();

          if (eventsData.success && eventsData.events && eventsData.events.length > 0) {
            setLiveEvents(eventsData.events);
            setCurrentEvent(eventsData.events[0]);
            setLastAction(`${eventsData.events[0].type} - ${eventsData.events[0].description}`);
            hasEvents = true;
            console.log(`✅ [Sportsradar] Retrieved ${eventsData.events.length} events`);
          }
        }
      } catch (sportsradarError: any) {
        if (sportsradarError.name !== 'AbortError' && isMounted) {
          console.warn('⚠️ [Sportsradar] Events API failed:', sportsradarError.message);
        }
        // Don't throw, continue with fallback
      }

      // Try Sportsradar stats API
      try {
        const statsResponse = await fetch(`/api/sportsradar/fixtures/${matchId}/stats`, {
          signal: controller.signal
        });

        if (statsResponse.ok && isMounted) {
          const statsData = await statsResponse.json();

          if (statsData.success && statsData.statistics) {
            setLiveStats(statsData.statistics);
            hasStats = true;
            console.log(`✅ [Sportsradar] Retrieved live statistics`);
          }
        }
      } catch (sportsradarStatsError: any) {
        if (sportsradarStatsError.name !== 'AbortError' && isMounted) {
          console.warn('⚠️ [Sportsradar] Stats API failed:', sportsradarStatsError.message);
        }
        // Don't throw, continue with fallback
      }

      // Fallback to SoccersAPI if Sportsradar fails
      if (!hasEvents && isMounted && !controller.signal.aborted) {
        try {
          const soccersEventsResponse = await fetch(`/api/soccersapi/matches/${matchId}/events`, {
            signal: controller.signal
          });

          if (soccersEventsResponse.ok) {
            const soccersEventsData = await soccersEventsResponse.json();

            if (soccersEventsData.success && soccersEventsData.events && soccersEventsData.events.length > 0) {
              const convertedEvents = soccersEventsData.events.map((event: any, index: number) => ({
                id: event.id || `event-${index}`,
                time: { minute: event.minute || 0 },
                type: event.type || 'action',
                team: event.team || 'home',
                player: { name: event.player || 'Unknown', id: event.player_id || `player-${index}` },
                description: event.text || event.description || 'Live action'
              }));

              setLiveEvents(convertedEvents);
              setCurrentEvent(convertedEvents[0]);
              setLastAction(`${convertedEvents[0].type} - ${convertedEvents[0].description}`);
              hasEvents = true;
              console.log(`✅ [SoccersAPI] Retrieved ${convertedEvents.length} live events`);
            }
          }
        } catch (soccersError: any) {
          if (soccersError.name !== 'AbortError' && isMounted) {
            console.warn('⚠️ [SoccersAPI] Events fallback failed:', soccersError.message);
          }
          // Don't throw, continue
        }
      }

      if (!hasStats && isMounted && !controller.signal.aborted) {
        try {
          const soccersStatsResponse = await fetch(`/api/soccersapi/matches/${matchId}/stats`, {
            signal: controller.signal
          });

          if (soccersStatsResponse.ok) {
            const soccersStatsData = await soccersStatsResponse.json();

            if (soccersStatsData.success && soccersStatsData.statistics) {
              const convertedStats = {
                possession: {
                  home: soccersStatsData.statistics.possession_home || 50,
                  away: soccersStatsData.statistics.possession_away || 50
                },
                shots: {
                  home: soccersStatsData.statistics.shots_home || 0,
                  away: soccersStatsData.statistics.shots_away || 0
                },
                shotsOnTarget: {
                  home: soccersStatsData.statistics.shots_on_target_home || 0,
                  away: soccersStatsData.statistics.shots_on_target_away || 0
                },
                corners: {
                  home: soccersStatsData.statistics.corners_home || 0,
                  away: soccersStatsData.statistics.corners_away || 0
                },
                fouls: {
                  home: soccersStatsData.statistics.fouls_home || 0,
                  away: soccersStatsData.statistics.fouls_away || 0
                }
              };

              setLiveStats(convertedStats);
              hasStats = true;
              console.log(`✅ [SoccersAPI] Retrieved live statistics`);
            }
          }
        } catch (soccersStatsError: any) {
          if (soccersStatsError.name !== 'AbortError' && isMounted) {
            console.warn('⚠️ [SoccersAPI] Stats fallback failed:', soccersStatsError.message);
          }
          // Don't throw, continue
        }
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set default data if no APIs provided data
      if (!hasEvents && isMounted) {
        setLastAction('Live match in progress');
      }

      if (!hasStats && isMounted) {
        setLiveStats({
          possession: { home: 50, away: 50 },
          shots: { home: 0, away: 0 },
          shotsOnTarget: {home: 0, away: 0},
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 }
        });
      }

    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (isMounted && error.name !== 'AbortError') {
        console.error('❌ [Sportsradar Live Action] Error fetching data:', error);
        setError('Failed to load live data');
        setLastAction('Live match in progress');
        setLiveStats({
          possession: { home: 50, away: 50 },
          shots: { home: 0, away: 0 },
          shotsOnTarget: {home: 0, away: 0},
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 }
        });
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    // Return cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (!controller.signal.aborted) {
        try {
          controller.abort();
        } catch (cleanupError) {
          console.warn('⚠️ [Sportsradar] Cleanup abort error:', cleanupError);
        }
      }
    };
  }, [matchId, isLive]);

  // Main effect for fetching data and setting up intervals
  useEffect(() => {
    if (!matchId || !isLive) {
      console.log('❌ [Sportsradar Live Action] No match ID or match not live');
      return;
    }

    let updateInterval: NodeJS.Timeout | null = null;
    let cleanupFunction: (() => void) | null = null;

    // Initial fetch with cleanup function
    const initialFetch = async () => {
      try {
        cleanupFunction = await fetchSportsradarData();
      } catch (error) {
        console.warn('⚠️ [Sportsradar] Initial fetch error:', error);
      }
    };

    initialFetch();

    // Set up interval for live updates
    updateInterval = setInterval(async () => {
      try {
        // Clean up previous request if any
        if (cleanupFunction) {
          cleanupFunction();
        }
        cleanupFunction = await fetchSportsradarData();
      } catch (error) {
        console.warn('⚠️ [Sportsradar] Interval fetch error:', error);
      }
    }, 15000); // Update every 15 seconds

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [fetchSportsradarData]);

  // Simulate ball movement based on events
  useEffect(() => {
    if (!isLive || !currentEvent) return;

    const moveInterval = setInterval(() => {
      setBallPosition(prev => {
        const targetX = currentEvent.coordinates?.x || (currentEvent.team === 'home' ? 25 : 75);
        const targetY = currentEvent.coordinates?.y || 50;

        return {
          x: prev.x + (targetX - prev.x) * 0.1,
          y: prev.y + (targetY - prev.y) * 0.1
        };
      });
    }, 200);

    return () => clearInterval(moveInterval);
  }, [isLive, currentEvent]);

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">Sportsradar Live</span>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-textSecondary border-t-transparent mx-auto mb-2"></div>
              <p>Loading live data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">Sportsradar Live</span>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            <div className="text-center">
              <p className="mb-1">Match not live</p>
              <p className="text-xs opacity-60">Sportsradar data available during live matches</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">Sportsradar Live</span>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            <div className="text-center">
              <p className="text-red-400 mb-1">Failed to load live data</p>
              <p className="text-xs opacity-60">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} live-action-container sportsradar-style`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
        {/* Header - SportsRadar style */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-white text-sm font-bold uppercase tracking-wide">Live Match Tracker</span>
            </div>
            <div className="text-blue-100 text-xs font-medium bg-blue-800/30 px-2 py-1 rounded">
              {lastAction || 'Live Updates'}
            </div>
          </div>
        </div>

        {/* Match Info Header */}
        {homeTeamData && awayTeamData && (
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {homeTeamData.name} vs {awayTeamData.name}
              </span>
              <span className="text-gray-500 bg-white px-2 py-1 rounded text-xs">
                Match ID: {matchId}
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Live Stats Display */}
        {liveStats && (
          <div className="p-4 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
              Live Statistics
            </h3>
            <div className="space-y-4">
              {/* Ball Possession */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-600">Ball Possession</span>
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="text-blue-600">{liveStats.possession?.home || 50}%</span>
                    <span className="text-red-600">{liveStats.possession?.away || 50}%</span>
                  </div>
                </div>
                <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-1000"
                    style={{ width: `${liveStats.possession?.home || 50}%` }}
                  ></div>
                  <div 
                    className="absolute right-0 top-0 bg-gradient-to-l from-red-500 to-red-600 h-full transition-all duration-1000"
                    style={{ width: `${liveStats.possession?.away || 50}%` }}
                  ></div>
                </div>
              </div>

              {/* Shots Comparison */}
              <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <div className="text-lg font-bold text-blue-600">{liveStats.shots?.home || 0}</div>
                  <div className="text-xs text-gray-600">Shots</div>
                </div>
                <div className="border-l border-r border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">On Target</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {liveStats.shotsOnTarget?.home || 0} - {liveStats.shotsOnTarget?.away || 0}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{liveStats.shots?.away || 0}</div>
                  <div className="text-xs text-gray-600">Shots</div>
                </div>
              </div>

              {/* Additional Stats */}
              {(liveStats.corners || liveStats.fouls) && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {liveStats.corners && (
                    <div className="bg-yellow-50 p-2 rounded border-l-3 border-yellow-400">
                      <div className="font-medium text-gray-700">Corners</div>
                      <div className="text-sm font-bold text-yellow-700">
                        {liveStats.corners.home || 0} - {liveStats.corners.away || 0}
                      </div>
                    </div>
                  )}
                  {liveStats.fouls && (
                    <div className="bg-orange-50 p-2 rounded border-l-3 border-orange-400">
                      <div className="font-medium text-gray-700">Fouls</div>
                      <div className="text-sm font-bold text-orange-700">
                        {liveStats.fouls.home || 0} - {liveStats.fouls.away || 0}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Events - SportsRadar Style */}
        {liveEvents.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Recent Events</h3>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {liveEvents.slice(0, 6).map((event, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded min-w-[30px] text-center">
                        {event.time.minute}'
                      </div>
                      <div className="flex items-center gap-2">
                        {event.type === 'goal' && <span className="text-green-600">⚽</span>}
                        {event.type === 'card' && <span className="text-yellow-500">🟨</span>}
                        {event.type === 'substitution' && <span className="text-blue-500">🔄</span>}
                        {event.type === 'corner' && <span className="text-orange-500">📐</span>}
                        <span className="text-gray-700 text-sm font-medium">{event.description}</span>
                      </div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      event.team === 'home' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {event.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyNewLiveAction;