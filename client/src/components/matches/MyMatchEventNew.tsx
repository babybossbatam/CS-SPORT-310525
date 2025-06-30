typescript
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { getPlayerImage, preloadPlayerImages } from '@/lib/playerImageCache';
import '@/styles/MyPlayer.css';

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

      // Preload player images
      if (eventData && eventData.length > 0) {
        const players = eventData.flatMap((event: MatchEvent) => [
          { id: event.player?.id, name: event.player?.name },
          ...(event.assist ? [{ id: event.assist.id, name: event.assist.name }] : [])
        ]).filter((player, index, self) => 
          player.id && self.findIndex(p => p.id === player.id) === index
        );

        preloadPlayerImages(players);
      }
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

  // Player image cache state
  const [playerImages, setPlayerImages] = useState<Record<string, string>>({});

  const getCachedPlayerImage = async (playerId?: number, playerName?: string): Promise<string> => {
    const cacheKey = `${playerId || 'unknown'}_${playerName || 'unknown'}`;

    // Return cached image if available
    if (playerImages[cacheKey]) {
      return playerImages[cacheKey];
    }

    // Get image from cache system
    const imageUrl = await getPlayerImage(playerId, playerName);

    // Update local state
    setPlayerImages(prev => ({
      ...prev,
      [cacheKey]: imageUrl
    }));

    return imageUrl;
  };

  const formatTime = (elapsed: number, extra?: number) => {
    if (extra) {
      return `${elapsed}+${extra}'`;
    }
    return `${elapsed}'`;
  };

  const getEventDescription = (event: MatchEvent) => {
    const playerName = event.player?.name || 'Unknown Player';
    const assistName = event.assist?.name;

    switch (event.type.toLowerCase()) {
      case 'goal':
        return `${playerName}${assistName ? ` (assist: ${assistName})` : ''}`;
      case 'card':
        return `${playerName}`;
      case 'subst':
        return `${playerName}`;
      default:
        return `${playerName}`;
    }
  };

  const groupEventsByPeriod = (events: MatchEvent[]) => {
    const periods = {
      fullTime: [] as MatchEvent[],
      secondHalf: [] as MatchEvent[],
      halfTime: [] as MatchEvent[],
      firstHalf: [] as MatchEvent[]
    };

    events.forEach(event => {
      const minute = event.time.elapsed;
      if (minute >= 90) {
        periods.fullTime.push(event);
      } else if (minute >= 46) {
        periods.secondHalf.push(event);
      } else if (minute === 45) {
        periods.halfTime.push(event);
      } else {
        periods.firstHalf.push(event);
      }
    });

    // Sort each period by time (descending for display from top to bottom)
    Object.keys(periods).forEach(key => {
      periods[key as keyof typeof periods].sort((a, b) => b.time.elapsed - a.time.elapsed);
    });

    return periods;
  };

  const isHomeTeam = (event: MatchEvent) => {
    return event.team?.name?.toLowerCase() === homeTeam?.toLowerCase();
  };

  const isDarkTheme = theme === 'dark';
  const groupedEvents = groupEventsByPeriod(events);

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

  const EventItem = ({ event, isLast }: { event: MatchEvent; isLast: boolean }) => {
    const isHome = isHomeTeam(event);
    const isSubstitution = event.type.toLowerCase() === 'subst';
    const [mainPlayerImg, setMainPlayerImg] = useState<string>('');
    const [assistPlayerImg, setAssistPlayerImg] = useState<string>('');

    // Load player images when component mounts
    useEffect(() => {
      const loadImages = async () => {
        if (event.player?.id || event.player?.name) {
          const img = await getCachedPlayerImage(event.player.id, event.player.name);
          setMainPlayerImg(img);
        }

        if (isSubstitution && (event.assist?.id || event.assist?.name)) {
          const assistImg = await getCachedPlayerImage(event.assist.id, event.assist.name);
          setAssistPlayerImg(assistImg);
        }
      };

      loadImages();
    }, [event.player?.id, event.player?.name, event.assist?.id, event.assist?.name, isSubstitution]);

    return (
      <div className="relative flex items-center">
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute left-1/2 top-12 w-0.5 h-12 bg-gray-300 transform -translate-x-px"></div>
        )}

        {/* Left side - Home team events */}
        <div className="flex-1 pr-4">
          {isHome && (
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {getEventDescription(event)}
                </div>
                <div className="text-xs text-gray-500">{event.team?.name}</div>
              </div>
              {isSubstitution ? (
                <div className="player-image-substitution flex -space-x-2">
                  <img
                    src={mainPlayerImg || `https://ui-avatars.com/api/?name=${event.player?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}&size=40&background=4F46E5&color=fff&bold=true&format=svg`}
                    alt={event.player?.name}
                    className="player-image player-image-home-team"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const initials = event.player?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P';
                      const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=40&background=4F46E5&color=fff&bold=true&format=svg`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                  <img
                    src={assistPlayerImg || `https://ui-avatars.com/api/?name=${event.assist?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S'}&size=40&background=ef4444&color=fff&bold=true&format=svg`}
                    alt={event.assist?.name || 'Sub'}
                    className="player-image player-image-home-team"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const initials = event.assist?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S';
                      const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=40&background=ef4444&color=fff&bold=true&format=svg`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="event-icon-container event-icon-home">
                  <span className="text-sm">{getEventIcon(event.type, event.detail)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center - Time */}
        <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-300 rounded-full">
          <span className="text-xs font-bold text-gray-700">
            {formatTime(event.time.elapsed, event.time.extra)}
          </span>
        </div>

        {/* Right side - Away team events */}
        <div className="flex-1 pl-4">
          {!isHome && (
            <div className="flex items-center gap-3">
              {isSubstitution ? (
                <div className="player-image-substitution flex -space-x-2">
                  <img
                    src={mainPlayerImg || `https://ui-avatars.com/api/?name=${event.player?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}&size=40&background=4F46E5&color=fff&bold=true&format=svg`}
                    alt={event.player?.name}
                    className="player-image player-image-away-team"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const initials = event.player?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P';
                      const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=40&background=4F46E5&color=fff&bold=true&format=svg`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                  <img
                    src={assistPlayerImg || `https://ui-avatars.com/api/?name=${event.assist?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S'}&size=40&background=ef4444&color=fff&bold=true&format=svg`}
                    alt={event.assist?.name || 'Sub'}
                    className="player-image player-image-away-team"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const initials = event.assist?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S';
                      const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=40&background=ef4444&color=fff&bold=true&format=svg`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="event-icon-container event-icon-away">
                  <span className="text-sm">{getEventIcon(event.type, event.detail)}</span>
                </div>
              )}

              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">
                  {getEventDescription(event)}
                </div>
                <div className="text-xs text-gray-500">{event.team?.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PeriodHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center py-2">
      <div className="bg-gray-100 px-4 py-1 rounded-full">
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
    </div>
  );

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
          <div className="text-sm text-gray-600 flex justify-between">
            <span>{homeTeam}</span>
            <span>vs</span>
            <span>{awayTeam}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
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
              <p>No events recorded yet</p>
              <p className="text-sm">Events will appear as they happen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full Time Events */}
            {groupedEvents.fullTime.length > 0 && (
              <>
                <PeriodHeader title="End of 90 Minutes" />
                <div className="space-y-4">
                  {groupedEvents.fullTime.map((event, index) => (
                    <EventItem 
                      key={`ft-${index}`} 
                      event={event} 
                      isLast={index === groupedEvents.fullTime.length - 1 && 
                              groupedEvents.secondHalf.length === 0 && 
                              groupedEvents.halfTime.length === 0 && 
                              groupedEvents.firstHalf.length === 0} 
                    />
                  ))}
                </div>
              </>
            )}

            {/* Second Half Events */}
            {groupedEvents.secondHalf.length > 0 && (
              <>
                <PeriodHeader title="Second Half" />
                <div className="space-y-4">
                  {groupedEvents.secondHalf.map((event, index) => (
                    <EventItem 
                      key={`2h-${index}`} 
                      event={event} 
                      isLast={index === groupedEvents.secondHalf.length - 1 && 
                              groupedEvents.halfTime.length === 0 && 
                              groupedEvents.firstHalf.length === 0} 
                    />
                  ))}
                </div>
              </>
            )}

            {/* Half Time */}
            {groupedEvents.halfTime.length > 0 && (
              <>
                <PeriodHeader title="Half Time" />
                <div className="space-y-4">
                  {groupedEvents.halfTime.map((event, index) => (
                    <EventItem 
                      key={`ht-${index}`} 
                      event={event} 
                      isLast={index === groupedEvents.halfTime.length - 1 && 
                              groupedEvents.firstHalf.length === 0} 
                    />
                  ))}
                </div>
              </>
            )}

            {/* First Half Events */}
            {groupedEvents.firstHalf.length > 0 && (
              <>
                <PeriodHeader title="First Half" />
                <div className="space-y-4">
                  {groupedEvents.firstHalf.map((event, index) => (
                    <EventItem 
                      key={`1h-${index}`} 
                      event={event} 
                      isLast={index === groupedEvents.firstHalf.length - 1} 
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMatchEventNew;