
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Clock, User, RefreshCw, AlertCircle } from 'lucide-react';

interface MyMatchEventNewProps {
  fixtureId: string | number;
  apiKey?: string;
  theme?: 'light' | 'dark' | '';
  refreshInterval?: number;
  showErrors?: boolean;
  showLogos?: boolean;
  className?: string;
  homeTeam?: string;
  awayTeam?: string;
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
    id?: number;
    name: string;
  };
  assist?: {
    id?: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

const MyMatchEventNew: React.FC<MyMatchEventNewProps> = ({
  fixtureId,
  theme = "light",
  refreshInterval = 15,
  showErrors = false,
  showLogos = true,
  className = "",
  homeTeam,
  awayTeam
}) => {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMatchEvents = async () => {
    if (!fixtureId) {
      setError('No fixture ID provided');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`📊 [MyMatchEventNew] Fetching events for fixture: ${fixtureId}`);
      
      const response = await fetch(`/api/fixtures/${fixtureId}/events`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const eventData = await response.json();
      console.log(`✅ [MyMatchEventNew] Received ${eventData.length} events`);
      
      setEvents(eventData || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error(`❌ [MyMatchEventNew] Error fetching events:`, error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchEvents();

    // Set up refresh interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchMatchEvents, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fixtureId, refreshInterval]);

  const getEventIcon = (eventType: string, detail: string) => {
    switch (eventType.toLowerCase()) {
      case 'goal':
        return detail.toLowerCase().includes('penalty') ? '⚽(P)' : '⚽';
      case 'card':
        return detail.toLowerCase().includes('yellow') ? '🟨' : '🟥';
      case 'subst':
        return '🔄';
      case 'var':
        return '📺';
      default:
        return '📝';
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    const playerName = event.player?.name || 'Unknown Player';
    const assistName = event.assist?.name;
    
    switch (event.type.toLowerCase()) {
      case 'goal':
        return `${playerName}${assistName ? ` (assist: ${assistName})` : ''}`;
      case 'card':
        return `${playerName} - ${event.detail}`;
      case 'subst':
        return `${playerName} ${event.detail}`;
      default:
        return `${playerName} - ${event.detail}`;
    }
  };

  const formatTime = (elapsed: number, extra?: number) => {
    if (extra) {
      return `${elapsed}+${extra}'`;
    }
    return `${elapsed}'`;
  };

  const isDarkTheme = theme === 'dark';

  if (error && showErrors) {
    return (
      <Card className={`${className} ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isDarkTheme ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader className={`pb-3 ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Match Events</h3>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        {homeTeam && awayTeam && (
          <div className="text-sm text-gray-600">
            {homeTeam} vs {awayTeam}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading match events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No events recorded yet</p>
              <p className="text-sm">Events will appear as they happen</p>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-1">
              {events.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    isDarkTheme ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100'
                  }`}
                >
                  {/* Time */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-sm font-mono font-medium text-blue-600">
                      {formatTime(event.time.elapsed, event.time.extra)}
                    </span>
                  </div>

                  {/* Event Icon */}
                  <div className="flex-shrink-0 text-lg">
                    {getEventIcon(event.type, event.detail)}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {showLogos && event.team?.logo && (
                        <img
                          src={event.team.logo}
                          alt={event.team.name}
                          className="w-4 h-4 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {event.team?.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {getEventDescription(event)}
                    </div>
                    {event.comments && (
                      <div className="text-xs text-gray-500 mt-1 italic">
                        {event.comments}
                      </div>
                    )}
                  </div>

                  {/* Event Type Badge */}
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      event.type.toLowerCase() === 'goal' 
                        ? 'bg-green-100 text-green-700'
                        : event.type.toLowerCase() === 'card'
                        ? 'bg-yellow-100 text-yellow-700'
                        : event.type.toLowerCase() === 'subst'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMatchEventNew;
