
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LiveActionProps {
  fixtureId: number;
  refreshInterval?: number;
}

interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface LiveStats {
  ballPossession?: { home: string; away: string };
  shotsOnGoal?: { home: number; away: number };
  shotsTotal?: { home: number; away: number };
  fouls?: { home: number; away: number };
  cornerKicks?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  redCards?: { home: number; away: number };
}

const EnhancedLiveAction: React.FC<LiveActionProps> = ({ 
  fixtureId, 
  refreshInterval = 30000 
}) => {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchLiveData = async () => {
    try {
      // Fetch match events
      const eventsResponse = await fetch(`/api/fixtures/${fixtureId}/events`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData || []);
      }

      // Fetch live statistics
      const statsResponse = await fetch(`/api/fixtures/${fixtureId}/statistics`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setLiveStats(statsData || {});
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    
    const interval = setInterval(fetchLiveData, refreshInterval);
    return () => clearInterval(interval);
  }, [fixtureId, refreshInterval]);

  const getEventIcon = (type: string, detail: string) => {
    switch (type.toLowerCase()) {
      case 'goal':
        return '⚽';
      case 'card':
        return detail.toLowerCase().includes('yellow') ? '🟨' : '🟥';
      case 'subst':
        return '🔄';
      case 'var':
        return '📺';
      default:
        return '⚽';
    }
  };

  const formatEventDescription = (event: MatchEvent) => {
    const time = `${event.time.elapsed}'${event.time.extra ? `+${event.time.extra}` : ''}`;
    
    switch (event.type.toLowerCase()) {
      case 'goal':
        const assistText = event.assist ? ` (Assist: ${event.assist.name})` : '';
        return `${time} - ${event.player.name} scores${assistText}`;
      case 'card':
        return `${time} - ${event.player.name} receives ${event.detail}`;
      case 'subst':
        return `${time} - ${event.player.name} substituted`;
      default:
        return `${time} - ${event.detail}`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔴 Live Action
            <Badge variant="secondary">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            🔴 Live Action
            <Badge variant="secondary" className="animate-pulse">
              LIVE
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Statistics */}
        {Object.keys(liveStats).length > 0 && (
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">Match Statistics</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {liveStats.ballPossession && (
                <>
                  <span>{liveStats.ballPossession.home}%</span>
                  <span className="text-center">Possession</span>
                  <span className="text-right">{liveStats.ballPossession.away}%</span>
                </>
              )}
              {liveStats.shotsOnGoal && (
                <>
                  <span>{liveStats.shotsOnGoal.home}</span>
                  <span className="text-center">Shots on Target</span>
                  <span className="text-right">{liveStats.shotsOnGoal.away}</span>
                </>
              )}
              {liveStats.fouls && (
                <>
                  <span>{liveStats.fouls.home}</span>
                  <span className="text-center">Fouls</span>
                  <span className="text-right">{liveStats.fouls.away}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div>
          <h4 className="font-semibold mb-2">Recent Events</h4>
          {events.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-lg">{getEventIcon(event.type, event.detail)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formatEventDescription(event)}</p>
                    <p className="text-xs text-gray-600">{event.team.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No events yet...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLiveAction;
