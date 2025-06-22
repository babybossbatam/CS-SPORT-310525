
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MyHighlights from './MyHighlights';

interface MyLiveActionProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
}

interface PlayByPlayEvent {
  id: string;
  minute: number;
  team: 'home' | 'away';
  type: 'goal' | 'substitution' | 'card' | 'corner' | 'freekick' | 'offside' | 'foul' | 'shot' | 'save' | 'attempt';
  player: string;
  description: string;
  timestamp: number;
  isRecent?: boolean;
  x?: number;
  y?: number;
}

const MyLiveAction: React.FC<MyLiveActionProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "" 
}) => {
  const [liveData, setLiveData] = useState<any>(null);
  const [playByPlayEvents, setPlayByPlayEvents] = useState<PlayByPlayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PlayByPlayEvent | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [ballDirection, setBallDirection] = useState({ dx: 1, dy: 0.5 });
  const [ballPossession, setBallPossession] = useState<'home' | 'away' | null>('home');

  // Determine if match is currently live
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  // Fetch initial match data and set up real-time updates
  useEffect(() => {
    if (!matchId) {
      console.log('❌ [Live Action] No match ID provided');
      return;
    }

    let mounted = true;
    let updateInterval: NodeJS.Timeout;

    const fetchMatchData = async () => {
      try {
        setIsLoading(true);

        const liveResponse = await fetch(`/api/fixtures/live?_t=${Date.now()}`);
        if (liveResponse.ok && mounted) {
          const liveFixtures = await liveResponse.json();
          const liveMatch = liveFixtures.find((fixture: any) => 
            fixture.fixture.id === matchId
          );

          if (liveMatch && mounted) {
            setLiveData(liveMatch);
            await generatePlayByPlayEvents(liveMatch);
            setIsLoading(false);
            return liveMatch;
          }
        }

        const matchResponse = await fetch(`/api/fixtures?ids=${matchId}`);
        if (matchResponse.ok && mounted) {
          const matchData = await matchResponse.json();
          if (matchData.length > 0) {
            const match = matchData[0];
            setLiveData(match);
            await generatePlayByPlayEvents(match);
            setIsLoading(false);
            return match;
          }
        }

        setIsLoading(false);
        return null;
      } catch (error) {
        if (mounted) {
          console.error('❌ [Live Action] Error fetching match data:', error);
          setIsLoading(false);
        }
        return null;
      }
    };

    const fetchLiveUpdates = async () => {
      if (!liveData) return;

      try {
        const response = await fetch(`/api/fixtures/live?_t=${Date.now()}`);
        if (response.ok && mounted) {
          const liveFixtures = await response.json();
          const currentMatch = liveFixtures.find((fixture: any) => 
            fixture.fixture.id === matchId
          );

          if (currentMatch && mounted) {
            const previousElapsed = liveData.fixture?.status?.elapsed || 0;
            const currentElapsed = currentMatch.fixture?.status?.elapsed || 0;

            setLiveData(currentMatch);

            if (currentElapsed > previousElapsed) {
              await generatePlayByPlayEvents(currentMatch, true);
            }
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ [Live Action] Error fetching live updates:', error);
        }
      }
    };

    fetchMatchData().then((match) => {
      if (match && mounted) {
        const status = match.fixture?.status?.short;
        const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

        if (isLive) {
          updateInterval = setInterval(fetchLiveUpdates, 5000);
        }
      }
    });

    return () => {
      mounted = false;
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [matchId]);

  // Ball movement animation
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballDirection.dx * 0.8;
        let newY = prev.y + ballDirection.dy * 0.8;

        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;

        // Determine ball possession based on position
        if (newX < 50) {
          setBallPossession('home');
        } else {
          setBallPossession('away');
        }

        // Boundary checks with realistic bouncing
        if (newX <= 10 || newX >= 90) {
          newDx = -newDx + (Math.random() - 0.5) * 0.2;
          newX = Math.max(10, Math.min(90, newX));
        }

        if (newY <= 25 || newY >= 75) {
          newDy = -newDy + (Math.random() - 0.5) * 0.2;
          newY = Math.max(25, Math.min(75, newY));
        }

        // Add natural movement variation
        newDx += (Math.random() - 0.5) * 0.05;
        newDy += (Math.random() - 0.5) * 0.05;

        // Limit speed for realistic movement
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 1.5) {
          newDx = (newDx / speed) * 1.5;
          newDy = (newDy / speed) * 1.5;
        }

        setBallDirection({ dx: newDx, dy: newDy });

        return { x: newX, y: newY };
      });
    }, 150);

    return () => clearInterval(ballInterval);
  }, [isLive]);

  // Auto-update current event display
  useEffect(() => {
    if (playByPlayEvents.length > 0) {
      const latestEvent = playByPlayEvents[0];
      setCurrentEvent(latestEvent);

      const eventCycleInterval = setInterval(() => {
        const recentEvents = playByPlayEvents.slice(0, 3);
        const currentIndex = recentEvents.findIndex(e => e.id === currentEvent?.id);
        const nextIndex = (currentIndex + 1) % recentEvents.length;
        setCurrentEvent(recentEvents[nextIndex]);
      }, 3000);

      return () => clearInterval(eventCycleInterval);
    }
  }, [playByPlayEvents, currentEvent]);

  const generatePlayByPlayEvents = async (matchData: any, isUpdate: boolean = false) => {
    try {
      const response = await fetch(`/api/fixtures/${matchData.fixture.id}/events`);
      let realEvents: any[] = [];

      if (response.ok) {
        realEvents = await response.json();
      }

      const homeTeam = matchData.teams?.home;
      const awayTeam = matchData.teams?.away;
      const elapsed = matchData.fixture?.status?.elapsed || 0;
      const events: PlayByPlayEvent[] = [];

      if (realEvents.length > 0) {
        const recentEvents = realEvents
          .filter(event => event.time?.elapsed <= elapsed)
          .slice(-6)
          .reverse();

        recentEvents.forEach((event, index) => {
          const isHomeTeam = event.team?.id === homeTeam?.id;
          const team = isHomeTeam ? 'home' : 'away';

          let eventType = 'attempt';
          let description = event.detail || 'Match event';

          if (event.type === 'Goal') {
            eventType = 'goal';
            description = `GOAL! ${event.detail || ''}`;
          } else if (event.type === 'Card') {
            eventType = 'card';
            description = `${event.detail || 'Yellow'} Card`;
          } else if (event.type === 'subst') {
            eventType = 'substitution';
            description = 'Substitution';
          } else if (event.detail?.toLowerCase().includes('corner')) {
            eventType = 'corner';
            description = 'Corner';
          } else if (event.detail?.toLowerCase().includes('shot')) {
            eventType = 'shot';
            description = 'Shot';
          }

          let x = 50, y = 50;

          if (eventType === 'goal') {
            x = isHomeTeam ? 85 : 15;
            y = 50;
          } else if (eventType === 'corner') {
            x = isHomeTeam ? 85 : 15;
            y = Math.random() > 0.5 ? 30 : 70;
          } else {
            x = isHomeTeam ? 60 + Math.random() * 20 : 20 + Math.random() * 20;
            y = 35 + Math.random() * 30;
          }

          events.push({
            id: `real_event_${event.time?.elapsed}_${index}`,
            minute: event.time?.elapsed || elapsed,
            team,
            type: eventType as any,
            player: event.player?.name || event.assist?.name || 'Player',
            description,
            timestamp: Date.now() - (index * 10000),
            isRecent: index === 0 && isUpdate,
            x,
            y
          });
        });
      }

      events.sort((a, b) => b.timestamp - a.timestamp);

      if (isUpdate) {
        setPlayByPlayEvents(prev => [...events.slice(0, 3), ...prev.slice(0, 4)]);
      } else {
        setPlayByPlayEvents(events);
      }

    } catch (error) {
      console.error('❌ [Live Action] Error fetching real events:', error);
    }
  };

  const getTeamDisplayName = (team: 'home' | 'away') => {
    if (team === 'home') {
      return homeTeam?.code || homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOME';
    }
    return awayTeam?.code || awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWAY';
  };

  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;

  if (isLoading) {
    return (
      <div className={`w-full ${className} max-w-sm mx-auto`}>
        <div className="bg-green-700 rounded-lg overflow-hidden">
          <div className="bg-black/20 px-3 py-2 flex items-center justify-between">
            <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs px-2 py-1">
              Live Action
            </Badge>
            <div className="text-white text-xs">Loading...</div>
          </div>
          <div className="h-32 flex items-center justify-center text-white text-sm">
            Loading live action...
          </div>
        </div>
      </div>
    );
  }

  if (!displayMatch) {
    if (matchId && homeTeam && awayTeam) {
      return (
        <MyHighlights 
          matchId={matchId}
          homeTeam={homeTeam?.name || homeTeam}
          awayTeam={awayTeam?.name || awayTeam}
          className={className}
        />
      );
    }

    return (
      <div className={`w-full ${className} max-w-sm mx-auto`}>
        <div className="bg-gray-700 rounded-lg overflow-hidden">
          <div className="bg-black/20 px-3 py-2 flex items-center justify-between">
            <Badge className="bg-gray-600 hover:bg-gray-600 text-white text-xs px-2 py-1">
              Live Action
            </Badge>
          </div>
          <div className="h-32 flex items-center justify-center text-white text-sm">
            {matchId ? `No match data found` : 'No match selected'}
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`w-full ${className} max-w-sm mx-auto`}>
        <div className="bg-gray-700 rounded-lg overflow-hidden">
          <div className="bg-black/20 px-3 py-2 flex items-center justify-between">
            <Badge className="bg-gray-600 hover:bg-gray-600 text-white text-xs px-2 py-1">
              Live Action
            </Badge>
          </div>
          <div className="h-32 flex items-center justify-center text-white text-sm">
            <div className="text-center">
              <p className="mb-1">Match not live</p>
              <p className="text-xs opacity-60">
                {homeTeamData?.name} vs {awayTeamData?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} live-action-container max-w-md mx-auto`}>
      <div className="bg-gradient-to-br from-green-700 via-green-750 to-green-800 rounded-xl overflow-hidden shadow-2xl flash-effect border border-green-600/30">
        {/* Header - Enhanced 365scores style */}
        <div className="bg-black/30 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs px-2 py-1 font-semibold live-pulse rounded-md">
              ● LIVE
            </Badge>
            <span className="text-white/80 text-xs font-medium">Action</span>
          </div>
          <div className="text-white text-sm font-bold opacity-95">
            {elapsed}'
          </div>
        </div>

        {/* Football Field - Enhanced 365scores style */}
        <div className="relative h-40 sm:h-48 field-overlay overflow-hidden bg-gradient-to-br from-green-600 to-green-800">
          
          {/* Field Pattern - Enhanced realism */}
          <div className="absolute inset-0">
            {/* Grass texture overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-b from-green-500/10 via-transparent to-green-900/20"></div>
            </div>
            
            {/* Grass stripes - More pronounced */}
            <div className="absolute inset-0 opacity-15">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full"
                  style={{
                    width: '12.5%',
                    left: `${i * 12.5}%`,
                    background: i % 2 === 0 
                      ? 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(21, 128, 61, 0.2), transparent)'
                  }}
                />
              ))}
            </div>

            {/* Field markings - Enhanced visibility */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Outer boundary */}
              <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              
              {/* Center line */}
              <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              
              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.8)"/>
              
              {/* Goal areas */}
              <rect x="5" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              <rect x="87" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              
              {/* Penalty areas */}
              <rect x="5" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              <rect x="77" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" filter="url(#glow)"/>
              
              {/* Penalty spots */}
              <circle cx="17" cy="50" r="0.8" fill="rgba(255,255,255,0.8)"/>
              <circle cx="83" cy="50" r="0.8" fill="rgba(255,255,255,0.8)"/>
              
              {/* Corner arcs */}
              <path d="M 5 15 Q 8 15 8 18" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
              <path d="M 5 85 Q 8 85 8 82" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
              <path d="M 95 15 Q 92 15 92 18" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
              <path d="M 95 85 Q 92 85 92 82" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
            </svg>
          </div>

          {/* Ball - Enhanced 365scores style with glow */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-linear z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Ball glow effect */}
              <div className="absolute inset-0 w-4 h-4 bg-white/50 rounded-full blur-sm scale-150"></div>
              {/* Ball */}
              <div 
                className="relative w-4 h-4 rounded-full shadow-lg"
                style={{
                  background: 'radial-gradient(circle at 25% 25%, #ffffff, #f8f8f8, #e0e0e0)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {/* Ball pattern */}
                <div className="absolute inset-0 rounded-full opacity-20">
                  <div className="absolute top-1 left-1 w-1 h-1 bg-black/30 rounded-full"></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-black/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Team possession overlay - Enhanced 365scores style */}
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-black/85 backdrop-blur-md rounded-lg px-5 py-3 text-center possession-fade-in border border-white/25 shadow-2xl">
              <div className="text-white text-sm font-medium mb-2 opacity-95 tracking-wide">
                Ball Safe
              </div>
              <div className="flex items-center justify-center gap-3">
                {ballPossession === 'home' && homeTeamData?.logo && (
                  <div className="relative">
                    <img 
                      src={homeTeamData.logo} 
                      alt={homeTeamData.name}
                      className="w-6 h-6 object-contain rounded-full"
                    />
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/30"></div>
                  </div>
                )}
                {ballPossession === 'away' && awayTeamData?.logo && (
                  <div className="relative">
                    <img 
                      src={awayTeamData.logo} 
                      alt={awayTeamData.name}
                      className="w-6 h-6 object-contain rounded-full"
                    />
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/30"></div>
                  </div>
                )}
                <div className="text-white text-base font-bold tracking-wider">
                  {ballPossession === 'home' 
                    ? getTeamDisplayName('home') 
                    : getTeamDisplayName('away')
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Match event indicator - if available */}
          {currentEvent && (
            <div className="absolute top-2 left-2 z-50">
              <div className="bg-yellow-500/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-black font-semibold shadow-lg animate-pulse">
                {currentEvent.description}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyLiveAction;
