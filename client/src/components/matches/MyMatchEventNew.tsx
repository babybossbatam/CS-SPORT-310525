import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { getPlayerImage } from '@/lib/playerImageCache';
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
  const [playerImages, setPlayerImages] = useState<Record<string, string>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlayerImages = async (events: MatchEvent[]) => {
    const imagePromises = events.map(async (event) => {
      if (event.player?.id && event.player?.name) {
        try {
          const imageUrl = await getPlayerImage(event.player.id, event.player.name);
          return [`${event.player.id}-${event.player.name}`, imageUrl];
        } catch (error) {
          console.warn(`⚠️ [MyMatchEventNew] Failed to load image for player ${event.player.name}:`, error);
          return null;
        }
      }
      return null;
    });

    const results = await Promise.allSettled(imagePromises);
    const newPlayerImages: Record<string, string> = {};

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const [key, url] = result.value as [string, string];
        newPlayerImages[key] = url;
      }
    });

    setPlayerImages(prev => ({ ...prev, ...newPlayerImages }));
  };

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

      // Load player images after setting events
      if (eventData && eventData.length > 0) {
        loadPlayerImages(eventData);
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

  const PlayerAvatar = ({ event }: { event: MatchEvent }) => {
    const playerKey = event.player?.id && event.player?.name ? `${event.player.id}-${event.player.name}` : '';
    const imageUrl = playerImages[playerKey];
    const isHome = isHomeTeam(event);

    if (!event.player?.name) return null;

    const initials = event.player.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'P';

    console.log(`🖼️ [PlayerAvatar] Player: ${event.player.name}, ID: ${event.player.id}, Image URL: ${imageUrl}`);

    return (
      <div className="player-image-container">
        {imageUrl && imageUrl.startsWith('/api/player-photo/') ? (
          <img
            src={imageUrl}
            alt={event.player.name}
            className={`player-image ${isHome ? 'player-image-home-team' : 'player-image-away-team'}`}
            onError={(e) => {
              console.warn(`❌ [PlayerAvatar] API image failed to load for ${event.player.name}: ${imageUrl}`);
              // Fallback to initials if API image fails to load
              e.currentTarget.style.display = 'none';
              const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallbackElement) {
                fallbackElement.classList.remove('hidden');
              }
            }}
            onLoad={() => {
              console.log(`✅ [PlayerAvatar] API image loaded successfully for ${event.player.name}: ${imageUrl}`);
              // Hide the fallback element when API image loads successfully
              const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallbackElement) {
                fallbackElement.classList.add('hidden');
              }
            }}
          />
        ) : imageUrl && imageUrl.includes('ui-avatars.com') ? (
          <img
            src={imageUrl}
            alt={event.player.name}
            className={`player-image ${isHome ? 'player-image-home-team' : 'player-image-away-team'}`}
            onLoad={() => {
              console.log(`✅ [PlayerAvatar] Fallback avatar loaded for ${event.player.name}`);
            }}
          />
        ) : null}
        <div
          className={`player-image player-image-error ${isHome ? 'player-image-home-team' : 'player-image-away-team'} ${imageUrl && imageUrl.startsWith('/api/player-photo/') ? 'hidden' : ''}`}
        >
          {initials}
        </div>
      </div>
    );
  };

  const EventItem = ({ event, isLast }: { event: MatchEvent; isLast: boolean }) => {
    const isHome = isHomeTeam(event);

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
              <div className="flex items-center gap-2">
                <PlayerAvatar event={event} />
                <div className="event-icon-container event-icon-home">
                  <span className="text-sm">{getEventIcon(event.type, event.detail)}</span>
                </div>
              </div>
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
              <div className="flex items-center gap-2">
                <div className="event-icon-container event-icon-away">
                  <span className="text-sm">{getEventIcon(event.type, event.detail)}</span>
                </div>
                <PlayerAvatar event={event} />
              </div>

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