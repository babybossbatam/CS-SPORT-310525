import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

import { Clock, RefreshCw, AlertCircle } from 'lucide-react';

import '@/styles/MyPlayer.css';
import '@/styles/MyMatchEventNew.css';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

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
    if (!eventType) return '📝';

    switch (eventType.toLowerCase()) {
      case 'goal':
        return detail?.toLowerCase().includes('penalty') ? '⚽(P)' : '⚽';
      case 'card':
        return detail?.toLowerCase().includes('yellow') ? '🟨' : '🟥';
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

    if (!event.type) return playerName;

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

  const getPlayerImage = (playerId: number | undefined, playerName: string | undefined) => {
    if (!playerId) {
      return '';
    }
    return `/api/player-photo/${playerId}`;
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
                <div className="event-icon-container event-icon-home">
                  {event.type === 'subst' ? (
                    <img 
                      src="/assets/matchdetaillogo/substitution.svg" 
                      alt="Substitution" 
                      className="w-4 h-4"
                    />
                  ) : (
                    <span className="text-sm">{getEventIcon(event.type, event.detail)}</span>
                  )}
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
                  {event.type === 'subst' ? (
                    <img 
                      src="/assets/matchdetaillogo/substitution.svg" 
                      alt="Substitution" 
                      className="w-4 h-4"
                    />
                  ) : (
                    <span className="text-sm">{getEventIcon(event.type, event.detail)}</span>
                  )}
                </div>
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
            {/* All events in chronological order without period separators */}
            {events
              .sort((a, b) => b.time.elapsed - a.time.elapsed) // Sort by time, most recent first
              .map((event, index) => {
                const isHome = event.team?.name === homeTeam;

                return (
                  <div key={`event-${index}`} className="match-event-container">
                    {/* Three-grid layout container */}
                    <div className="match-event-three-grid-container">
                      {/* Time display in middle content area */}
                      <div className="text-xs font-semibold text-gray-700 text-center mb-2">
                        {event.time?.elapsed}'
                        {event.time?.extra && ` +${event.time.extra}`}
                      </div>
                      
                      {/* Left Grid: Home Team Events */}
                      <div className="match-event-home-side">
                        {isHome && (
                          <div className="flex items-center gap-3 pr-16 ">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-9 h-9 border-2 border-green-300 shadow-sm">
                                <AvatarImage
                                  src={getPlayerImage(event.player?.id, event.player?.name)}
                                  alt={event.player?.name || 'Player'}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                                  {event.player?.name
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 2) || 'P'}
                                </AvatarFallback>
                              </Avatar>

                              {event.type === 'subst' && event.assist?.name && (
                                <Avatar className="w-9 h-9 border-2 border-red-300 shadow-sm -ml-4 relative-z20">
                                  <AvatarImage
                                    src={getPlayerImage(event.assist?.id, event.assist?.name)}
                                    alt={event.assist?.name || 'Player'}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-blue-400 text-white text-xs font-bold">
                                    {event.assist?.name
                                      ?.split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .slice(0, 2) || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>

                            <div className="flex-1 text-left">
                              {event.type === 'subst' && event.assist?.name ? (
                                <>
                                  <div className="text-xs font-medium text-green-600">
                                    {event.assist.name}
                                  </div>
                                  <div className="text-xs font-medium text-red-600">
                                    {event.player?.name || 'Unknown Player'}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs font-medium text-gray-700">
                                  {event.player?.name || 'Unknown Player'}
                                </div>
                              )}
                              {event.type === 'goal' && event.assist?.name && (
                                <div className="text-xs text-gray-600">
                                  (Assist: {event.assist.name})
                                </div>
                              )}
                              {event.type !== 'subst' && (
                                <div className="text-xs text-gray-400">
                                  {event.detail || event.type}
                                </div>
                              )}
                            </div>

                            <div className={`match-event-icon ${event.type === 'goal' ? 'goal' : event.type === 'card' ? 'card' : 'substitution'}`}>
                              {event.type === 'subst' ? (
                                <img 
                                  src="/assets/matchdetaillogo/substitution.svg" 
                                  alt="Substitution" 
                                  className="w-4 h-4"
                                />
                              ) : (
                                <span className="text-xs">{getEventIcon(event.type, event.detail)}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Center Grid: Time */}
                      <div className="match-event-time-center">
                        {/* Time display moved to middle content area */}
                      </div>

                      {/* Right Grid: Away Team Events */}
                      <div className="match-event-away-side">
                        {!isHome && (
                          <div className="flex items-center gap-3 pl-12 ">
                            <div className={`match-event-icon ${event.type === 'goal' ? 'goal' : event.type === 'card' ? 'card' : 'substitution'}`}>
                              {event.type === 'subst' ? (
                                <img 
                                  src="/assets/matchdetaillogo/substitution.svg" 
                                  alt="Substitution" 
                                  className="w-4 h-4"
                                />
                              ) : (
                                <span className="text-xs">{getEventIcon(event.type, event.detail)}</span>
                              )}
                            </div>

                            <div className="flex-1 text-right">
                              {event.type === 'subst' && event.assist?.name ? (
                                <>
                                  <div className="text-xs font-md text-green-600">
                                    {event.assist.name}
                                  </div>
                                  <div className="text-xs font-medium text-red-600">
                                    {event.player?.name || 'Unknown Player'}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs font-medium text-black-600">
                                  {event.player?.name || 'Unknown Player'}
                                </div>
                              )}
                              {event.type === 'goal' && event.assist?.name && (
                                <div className="text-xs text-gray-600">
                                  (Assist: {event.assist.name})
                                </div>
                              )}
                              {event.type !== 'subst' && (
                                <div className="text-xs text-gray-600">
                                  {event.detail || event.type}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {event.type === 'subst' && event.assist?.name && (
                                <Avatar className="w-9 h-9 border-2 border-red-400 shadow-sm -mr-3 z-20">
                                  <AvatarImage
                                    src={getPlayerImage(event.assist?.id, event.assist?.name)}
                                    alt={event.assist?.name || 'Player'}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-red-400 text-white text-xs font-bold">
                                    {event.assist?.name
                                      ?.split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .slice(0, 2) || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <Avatar className="w-9 h-9 border-2 border-green-400 shadow-sm -mr-2 ">
                                <AvatarImage
                                  src={getPlayerImage(event.player?.id, event.player?.name)}
                                  alt={event.player?.name || 'Player'}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-red-500 text-white text-xs font-bold">
                                  {event.player?.name
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 2) || 'P'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMatchEventNew;