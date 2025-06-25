import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import '../../styles/liveaction.css';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyCircularFlag from '@/components/common/MyCircularFlag';
import { isNationalTeam } from '@/lib/teamLogoSources';

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
  yellowCards?: {
    home: number;
    away: number;
  };
  redCards?: {
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
  const [matchData, setMatchData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);

  // Memoize the live status check to prevent unnecessary re-renders
  const isLive = useMemo(() => {
    return status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);
  }, [status]);

  // Fetch match data and live updates
  const fetchSportsradarData = useCallback(async () => {
    if (!matchId || !isLive) {
      console.log('❌ [Sportradar Live Action] No match ID or match not live');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setIsLoading(true);
      setError(null);

      // Set timeout for requests
      timeoutId = setTimeout(() => {
        if (isMounted && !controller.signal.aborted) {
          try {
            controller.abort();
            console.warn('⏰ [Sportradar] Request timeout');
            if (isMounted) {
              setError('Request timeout');
              setIsLoading(false);
            }
          } catch (abortError) {
            console.warn('⚠️ [Sportradar] Error during abort:', abortError);
          }
        }
      }, 10000);

      // Fetch match details first
      try {
        const matchResponse = await fetch(`/api/fixtures/${matchId}`, {
          signal: controller.signal
        });

        if (matchResponse.ok && isMounted) {
          const match = await matchResponse.json();
          setMatchData(match);
          setElapsed(match.fixture?.status?.elapsed || 0);
        }
      } catch (matchError: any) {
        if (matchError.name !== 'AbortError' && isMounted) {
          console.warn('⚠️ [Sportradar] Match data failed:', matchError.message);
        }
      }

      // Try Sportsradar API for events
      try {
        const eventsResponse = await fetch(`/api/sportsradar/fixtures/${matchId}/events`, {
          signal: controller.signal
        });

        if (eventsResponse.ok && isMounted) {
          const eventsData = await eventsResponse.json();

          if (eventsData.success && eventsData.events && eventsData.events.length > 0) {
            setLiveEvents(eventsData.events);
            setCurrentEvent(eventsData.events[0]);
            console.log(`✅ [Sportradar] Retrieved ${eventsData.events.length} events`);
          }
        }
      } catch (sportsradarError: any) {
        if (sportsradarError.name !== 'AbortError' && isMounted) {
          console.warn('⚠️ [Sportradar] Events API failed:', sportsradarError.message);
        }
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
            console.log(`✅ [Sportradar] Retrieved live statistics`);
          }
        }
      } catch (sportsradarStatsError: any) {
        if (sportsradarStatsError.name !== 'AbortError' && isMounted) {
          console.warn('⚠️ [Sportradar] Stats API failed:', sportsradarStatsError.message);
        }
      }

      // Fallback to default data if APIs fail
      if (!liveStats && isMounted) {
        setLiveStats({
          possession: { home: 50, away: 50 },
          shots: { home: 0, away: 0 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 },
          redCards: { home: 0, away: 0 }
        });
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (isMounted && error.name !== 'AbortError') {
        console.error('❌ [Sportradar Live Action] Error fetching data:', error);
        setError('Failed to load live data');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (!controller.signal.aborted) {
        try {
          controller.abort();
        } catch (cleanupError) {
          console.warn('⚠️ [Sportradar] Cleanup abort error:', cleanupError);
        }
      }
    };
  }, [matchId, isLive]);

  // Auto-hide current event after 12 seconds - optimized timing
  useEffect(() => {
    if (currentEvent) {
      const hideTimer = setTimeout(() => {
        setCurrentEvent(null);
      }, 12000); // Increased from 8s to 12s for better UX

      return () => clearTimeout(hideTimer);
    }
  }, [currentEvent]);

  // Main effect for fetching data (no auto-refresh)
  useEffect(() => {
    if (!matchId || !isLive) {
      return;
    }

    let cleanupFunction: (() => void) | null = null;

    const initialFetch = async () => {
      try {
        cleanupFunction = await fetchSportsradarData();
      } catch (error) {
        console.warn('⚠️ [Sportradar] Initial fetch error:', error);
      }
    };

    initialFetch();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [fetchSportsradarData]);

  const homeTeamData = homeTeam || matchData?.teams?.home;
  const awayTeamData = awayTeam || matchData?.teams?.away;

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading live match data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-800 font-medium mb-1">Match not live</p>
              <p className="text-gray-500 text-sm">Live tracking will begin when the match starts</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-1">Connection Error</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} sportradar-live-widget`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">

        {/* Sportradar-style Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm font-semibold uppercase tracking-wide">Live Match</h3>
                <p className="text-gray-600 text-xs">Real-time updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {elapsed}'
              </div>
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                {status}
              </div>
            </div>
          </div>
        </div>

        {/* Match Teams Header */}
        {homeTeamData && awayTeamData && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {matchData?.league?.country === "World" ||
                matchData?.league?.country === "International" ? (
                  <MyWorldTeamLogo
                    teamName={homeTeamData?.name}
                    teamLogo={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                    alt={homeTeamData?.name || 'Home Team'}
                    size="32px"
                    leagueContext={{
                      name: matchData?.league?.name || '',
                      country: matchData?.league?.country || '',
                    }}
                  />
                ) : isNationalTeam(homeTeamData, matchData?.league) ? (
                  <MyCircularFlag
                    teamName={homeTeamData?.name}
                    fallbackUrl={homeTeamData?.logo}
                    alt={homeTeamData?.name || 'Home Team'}
                    size="32px"
                  />
                ) : (
                  <img
                    src={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                    alt={homeTeamData?.name || 'Home Team'}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/fallback-logo.svg';
                    }}
                  />
                )}
                <span className="text-gray-900 font-medium">{homeTeamData?.name}</span>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {matchData?.goals?.home || 0} - {matchData?.goals?.away || 0}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-900 font-medium">{awayTeamData?.name}</span>
                <img
                  src={awayTeamData?.logo || '/assets/fallback-logo.svg'}
                  alt={awayTeamData?.name || 'Away Team'}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/fallback-logo.svg';
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Event Display */}
        {currentEvent && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {currentEvent.time.minute}'
                </div>
                <div className="flex items-center gap-2">
                  {currentEvent.type === 'goal' && <span className="text-green-600 text-lg">⚽</span>}
                  {currentEvent.type === 'card' && <span className="text-yellow-500 text-lg">🟨</span>}
                  {currentEvent.type === 'substitution' && <span className="text-blue-500 text-lg">🔄</span>}
                  {currentEvent.type === 'corner' && <span className="text-orange-500 text-lg">🚩</span>}
                  <span className="text-gray-900 font-medium">{currentEvent.description}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {currentEvent.player?.name || 'Live Event'}
              </div>
            </div>
          </div>
        )}

        {/* Live Statistics */}
        {liveStats && (
          <div className="p-6">
            <h4 className="text-gray-900 font-semibold text-sm mb-4 uppercase tracking-wide">Match Statistics</h4>

            <div className="space-y-4">
              {/* Ball Possession */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm font-medium">Ball Possession</span>
                  <div className="flex gap-4 text-sm font-semibold">
                    <span className="text-blue-600">{liveStats.possession?.home || 50}%</span>
                    <span className="text-red-600">{liveStats.possession?.away || 50}%</span>
                  </div>
                </div>
                <div className="relative bg-gray-200 rounded-full h-2">
                  <div 
                    className="absolute left-0 top-0 bg-blue-500 h-full rounded-l-full transition-all duration-1000"
                    style={{ width: `${liveStats.possession?.home || 50}%` }}
                  ></div>
                  <div 
                    className="absolute right-0 top-0 bg-red-500 h-full rounded-r-full transition-all duration-1000"
                    style={{ width: `${liveStats.possession?.away || 50}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                {/* Shots */}
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{liveStats.shots?.home || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">Shots</div>
                  <div className="text-lg font-bold text-red-600">{liveStats.shots?.away || 0}</div>
                </div>

                {/* Shots on Target */}
                <div className="text-center border-l border-r border-gray-200">
                  <div className="text-lg font-bold text-blue-600">{liveStats.shotsOnTarget?.home || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">On Target</div>
                  <div className="text-lg font-bold text-red-600">{liveStats.shotsOnTarget?.away || 0}</div>
                </div>

                {/* Corners */}
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{liveStats.corners?.home || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">Corners</div>
                  <div className="text-lg font-bold text-red-600">{liveStats.corners?.away || 0}</div>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-base font-semibold text-blue-600">{liveStats.fouls?.home || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">Fouls</div>
                  <div className="text-base font-semibold text-red-600">{liveStats.fouls?.away || 0}</div>
                </div>

                <div className="text-center">
                  <div className="text-base font-semibold text-blue-600">{liveStats.yellowCards?.home || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">Yellow Cards</div>
                  <div className="text-base font-semibold text-red-600">{liveStats.yellowCards?.away || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Events Timeline */}
        {liveEvents.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <h4 className="text-gray-900 font-semibold text-sm mb-3 uppercase tracking-wide">Recent Events</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {liveEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="bg-gray-600 text-white px-2 py-0.5 rounded text-xs font-medium min-w-[30px] text-center">
                    {event.time.minute}'
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    {event.type === 'goal' && <span>⚽</span>}
                    {event.type === 'card' && <span>🟨</span>}
                    {event.type === 'substitution' && <span>🔄</span>}
                    {event.type === 'corner' && <span>🚩</span>}
                    <span className="text-gray-700">{event.description}</span>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded ${
                    event.team === 'home' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {event.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by Sportradar</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyNewLiveAction;