
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import '../../styles/liveaction.css';

interface SoccersApiLiveActionProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
}

interface SoccersEvent {
  id: string;
  minute: number;
  type: string;
  team: string;
  player: string;
  text: string;
  timestamp?: number;
}

interface SoccersStats {
  possession_home: number;
  possession_away: number;
  shots_home: number;
  shots_away: number;
  corners_home: number;
  corners_away: number;
  fouls_home: number;
  fouls_away: number;
}

const SoccersApiLiveAction: React.FC<SoccersApiLiveActionProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "" 
}) => {
  const [liveEvents, setLiveEvents] = useState<SoccersEvent[]>([]);
  const [liveStats, setLiveStats] = useState<SoccersStats | null>(null);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // Determine if match is currently live
  const currentStatus = status;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);

  // Fetch SoccersAPI live data
  useEffect(() => {
    if (!matchId || !isLive) {
      console.log('❌ [SoccersAPI Live Action] No match ID or match not live');
      return;
    }

    let mounted = true;
    let updateInterval: NodeJS.Timeout;

    const fetchSoccersApiData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch match details
        const detailsResponse = await fetch(`/api/soccersapi/matches/${matchId}`);
        if (detailsResponse.ok && mounted) {
          const detailsData = await detailsResponse.json();
          if (detailsData.success) {
            setMatchDetails(detailsData.data);
          }
        }
        
        // Fetch live events
        const eventsResponse = await fetch(`/api/soccersapi/matches/${matchId}/events`);
        if (eventsResponse.ok && mounted) {
          const eventsData = await eventsResponse.json();
          
          if (eventsData.success && eventsData.events && eventsData.events.length > 0) {
            setLiveEvents(eventsData.events);
            const latestEvent = eventsData.events[0];
            setLastAction(`${latestEvent.type} - ${latestEvent.text || latestEvent.player}`);
            console.log(`✅ [SoccersAPI] Retrieved ${eventsData.events.length} live events`);
          } else {
            setLastAction('Live match - no recent events');
          }
        }

        // Fetch live stats
        const statsResponse = await fetch(`/api/soccersapi/matches/${matchId}/stats`);
        if (statsResponse.ok && mounted) {
          const statsData = await statsResponse.json();
          
          if (statsData.success && statsData.statistics) {
            setLiveStats(statsData.statistics);
            console.log(`✅ [SoccersAPI] Retrieved live statistics`);
          }
        }

        setIsLoading(false);
      } catch (error) {
        if (mounted) {
          console.error('❌ [SoccersAPI Live Action] Error fetching data:', error);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchSoccersApiData();

    // Set up real-time updates every 15 seconds for live matches
    if (isLive) {
      updateInterval = setInterval(fetchSoccersApiData, 15000);
    }

    return () => {
      mounted = false;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [matchId, isLive]);

  const homeTeamData = homeTeam;
  const awayTeamData = awayTeam;

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">SoccersAPI Live</span>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-textSecondary border-t-transparent mx-auto mb-2"></div>
              <p>Loading SoccersAPI data...</p>
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
            <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">SoccersAPI Live</span>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            <div className="text-center">
              <p className="mb-1">Match not live</p>
              <p className="text-xs opacity-60">SoccersAPI data available during live matches</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} live-action-container soccersapi-style`}>
      <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
        {/* Header - SoccersAPI style */}
        <div className="bg-surfacePrimary px-4 py-3 border-b border-dividerPrimary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-textPrimary text-sm font-medium uppercase tracking-wide">SoccersAPI Live</span>
            </div>
            <div className="text-textSecondary text-xs font-medium">
              {lastAction}
            </div>
          </div>
        </div>

        {/* Live Events Section */}
        <div className="bg-surfacePrimary px-4 py-3">
          <div className="text-center text-textSecondary text-xs font-medium mb-3 uppercase tracking-wide">
            Recent Events
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {liveEvents.slice(0, 5).map((event, index) => (
              <div key={event.id || index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-textSecondary text-xs">{event.minute}'</span>
                  <span className="text-textPrimary font-medium">{event.type}</span>
                </div>
                <div className="text-textSecondary text-xs">
                  {event.player || event.text}
                </div>
              </div>
            ))}
            
            {liveEvents.length === 0 && (
              <div className="text-center text-textSecondary text-sm py-2">
                No recent events
              </div>
            )}
          </div>
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
                  <span className="text-sm font-bold text-textPrimary">{liveStats.possession_home || 0}%</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.possession_away || 0}%</span>
                </div>
              </div>
              <div className="h-2 bg-dividerPrimary rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${liveStats.possession_home || 0}%` }}
                  ></div>
                  <div 
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${liveStats.possession_away || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Other Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-textSecondary mb-1">Shots</div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-textPrimary">{liveStats.shots_home || 0}</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.shots_away || 0}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-textSecondary mb-1">Corners</div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-textPrimary">{liveStats.corners_home || 0}</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.corners_away || 0}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-textSecondary mb-1">Fouls</div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-textPrimary">{liveStats.fouls_home || 0}</span>
                  <span className="text-sm font-bold text-textPrimary">{liveStats.fouls_away || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SoccersApiLiveAction;
