
import React, { useState, useEffect } from 'react';
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

  // Determine if match is currently live
  const currentStatus = status;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);

  // Fetch Sportsradar live data
  useEffect(() => {
    if (!matchId || !isLive) {
      console.log('❌ [Sportsradar Live Action] No match ID or match not live');
      return;
    }

    let mounted = true;
    let updateInterval: NodeJS.Timeout;
    let fetchTimeout: NodeJS.Timeout;

    const fetchSportsradarData = async () => {
      try {
        setIsLoading(true);
        
        // Set a timeout to prevent indefinite loading
        fetchTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('⏰ [Sportsradar] Request timeout, using fallback data');
            setLastAction('Live match in progress');
            setLiveStats({
              possession: { home: 50, away: 50 },
              shots: { home: 0, away: 0 },
              corners: { home: 0, away: 0 },
              fouls: { home: 0, away: 0 }
            });
            setIsLoading(false);
          }
        }, 5000); // 5 second timeout

        let hasEvents = false;
        let hasStats = false;

        // Try Sportsradar API first with timeout
        try {
          const eventsController = new AbortController();
          const eventsTimeoutId = setTimeout(() => eventsController.abort(), 3000);
          
          const eventsResponse = await fetch(`/api/sportsradar/fixtures/${matchId}/events`, {
            signal: eventsController.signal
          });
          clearTimeout(eventsTimeoutId);
          
          if (eventsResponse.ok && mounted) {
            const eventsData = await eventsResponse.json();
            
            if (eventsData.success && eventsData.events && eventsData.events.length > 0) {
              setLiveEvents(eventsData.events);
              setCurrentEvent(eventsData.events[0]);
              setLastAction(`${eventsData.events[0].type} - ${eventsData.events[0].description}`);
              hasEvents = true;
              console.log(`✅ [Sportsradar] Retrieved ${eventsData.events.length} events`);
            }
          }
        } catch (sportsradarError) {
          console.warn('⚠️ [Sportsradar] Events API failed:', sportsradarError.name || 'Unknown error');
        }

        // Try SoccersAPI fallback for events
        if (!hasEvents && mounted) {
          try {
            const soccersController = new AbortController();
            const soccersTimeoutId = setTimeout(() => soccersController.abort(), 3000);
            
            const soccersEventsResponse = await fetch(`/api/soccersapi/matches/${matchId}/events`, {
              signal: soccersController.signal
            });
            clearTimeout(soccersTimeoutId);
            
            if (soccersEventsResponse.ok && mounted) {
              const soccersEventsData = await soccersEventsResponse.json();
              
              if (soccersEventsData.success && soccersEventsData.events && soccersEventsData.events.length > 0) {
                const convertedEvents = soccersEventsData.events.map((event: any) => ({
                  id: event.id || `event-${Date.now()}`,
                  time: { minute: event.minute || 0 },
                  type: event.type || 'action',
                  team: event.team || 'home',
                  player: { name: event.player || 'Unknown' },
                  description: event.text || event.description || 'Live action'
                }));
                
                setLiveEvents(convertedEvents);
                setCurrentEvent(convertedEvents[0]);
                setLastAction(`${convertedEvents[0].type} - ${convertedEvents[0].description}`);
                hasEvents = true;
                console.log(`✅ [SoccersAPI] Retrieved ${convertedEvents.length} live events`);
              }
            }
          } catch (soccersError) {
            console.warn('⚠️ [SoccersAPI] Events fallback failed:', soccersError.name || 'Unknown error');
          }
        }

        // Try Sportsradar stats API
        try {
          const statsController = new AbortController();
          const statsTimeoutId = setTimeout(() => statsController.abort(), 3000);
          
          const statsResponse = await fetch(`/api/sportsradar/fixtures/${matchId}/stats`, {
            signal: statsController.signal
          });
          clearTimeout(statsTimeoutId);
          
          if (statsResponse.ok && mounted) {
            const statsData = await statsResponse.json();
            
            if (statsData.success && statsData.statistics) {
              setLiveStats(statsData.statistics);
              hasStats = true;
              console.log(`✅ [Sportsradar] Retrieved live statistics`);
            }
          }
        } catch (sportsradarStatsError) {
          console.warn('⚠️ [Sportsradar] Stats API failed:', sportsradarStatsError.name || 'Unknown error');
        }

        // Try SoccersAPI fallback for stats
        if (!hasStats && mounted) {
          try {
            const soccersStatsController = new AbortController();
            const soccersStatsTimeoutId = setTimeout(() => soccersStatsController.abort(), 3000);
            
            const soccersStatsResponse = await fetch(`/api/soccersapi/matches/${matchId}/stats`, {
              signal: soccersStatsController.signal
            });
            clearTimeout(soccersStatsTimeoutId);
            
            if (soccersStatsResponse.ok && mounted) {
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
          } catch (soccersStatsError) {
            console.warn('⚠️ [SoccersAPI] Stats fallback failed:', soccersStatsError.name || 'Unknown error');
          }
        }

        // Clear the timeout since we completed successfully
        clearTimeout(fetchTimeout);

        // Set final fallback data if nothing worked
        if (!hasEvents && mounted) {
          setLastAction('Live match in progress');
        }
        
        if (!hasStats && mounted) {
          setLiveStats({
            possession: { home: 50, away: 50 },
            shots: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            fouls: { home: 0, away: 0 }
          });
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ [Sportsradar Live Action] Error fetching data:', error);
          clearTimeout(fetchTimeout);
          setLastAction('Live match in progress');
          setLiveStats({
            possession: { home: 50, away: 50 },
            shots: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            fouls: { home: 0, away: 0 }
          });
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchSportsradarData();

    // Set up real-time updates every 10 seconds for live matches
    if (isLive) {
      updateInterval = setInterval(fetchSportsradarData, 10000);
    }

    return () => {
      mounted = false;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [matchId, isLive]);

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
    }, 100);

    return () => clearInterval(moveInterval);
  }, [isLive, currentEvent]);

  const homeTeamData = homeTeam;
  const awayTeamData = awayTeam;

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
              <p>Loading Sportsradar data...</p>
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

  return (
    <div className={`w-full ${className} live-action-container sportsradar-style`}>
      <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
        {/* Header - Sportsradar style */}
        <div className="bg-surfacePrimary px-4 py-3 border-b border-dividerPrimary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-textPrimary text-sm font-medium uppercase tracking-wide">Sportsradar Live</span>
            </div>
            <div className="text-textSecondary text-xs font-medium">
              {lastAction}
            </div>
          </div>
        </div>

        {/* Sportsradar Field Visualization */}
        <div className="relative h-80 bg-gradient-to-br from-green-700 via-green-600 to-green-700 overflow-hidden">
          
          {/* Field markings */}
          <div className="absolute inset-0">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Field outline */}
              <rect x="10" y="20" width="80" height="60" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
              
              {/* Center line and circle */}
              <line x1="50" y1="20" x2="50" y2="80" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
              
              {/* Penalty areas */}
              <rect x="10" y="35" width="15" height="30" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
              <rect x="75" y="35" width="15" height="30" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5"/>
              
              {/* Goals */}
              <rect x="9" y="45" width="1" height="10" fill="rgba(255,255,255,0.9)"/>
              <rect x="90" y="45" width="1" height="10" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>

          {/* Ball Position */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-lg border border-gray-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 rounded-full"></div>
            </div>
          </div>

          {/* Current Event Display */}
          {currentEvent && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-surfaceSecondary backdrop-blur-md rounded-lg px-4 py-3 text-center shadow-lg border border-dividerPrimary max-w-sm">
                <div className="text-orange-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Sportsradar Live
                </div>
                <div className="text-textPrimary text-sm font-bold mb-2">
                  {currentEvent.description}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-textSecondary text-xs">
                    {currentEvent.time.minute}' - {currentEvent.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Stats Section */}
        {liveStats && (
          <div className="bg-surfacePrimary px-4 py-3 border-t border-dividerPrimary">
            <div className="text-center text-textSecondary text-xs font-medium mb-3 uppercase tracking-wide">
              Live Statistics
            </div>

            {/* Possession */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-textSecondary">Possession</span>
                <div className="flex gap-4">
                  <span className="text-sm font-bold text-textPrimary">{liveStats.possession?.home || 0}%</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.possession?.away || 0}%</span>
                </div>
              </div>
              <div className="h-2 bg-dividerPrimary rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${liveStats.possession?.home || 0}%` }}
                  ></div>
                  <div 
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${liveStats.possession?.away || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Shots & Corners */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-textSecondary mb-1">Shots</div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-textPrimary">{liveStats.shots?.home || 0}</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.shots?.away || 0}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-textSecondary mb-1">Corners</div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-textPrimary">{liveStats.corners?.home || 0}</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.corners?.away || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyNewLiveAction;
