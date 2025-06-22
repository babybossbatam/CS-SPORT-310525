
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
    <div className={`w-full ${className} live-action-container mx-auto`}>
      <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-lg overflow-hidden shadow-lg flash-effect">
        {/* Header - 365scores style */}
        <div className="bg-black/25 px-3 py-2 flex items-center justify-between border-b border-white/10">
          <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs px-2 py-1 font-semibold live-pulse">
            Live Action
          </Badge>
          <div className="text-white text-xs font-medium opacity-90">
            {elapsed}'
          </div>
        </div>

        {/* Football Field - Compact 365scores style */}
        <div className="relative h-36 field-overlay overflow-hidden">
          
          {/* Field Pattern - More subtle */}
          <div className="absolute inset-0">
            {/* Grass stripes */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full bg-gradient-to-r from-transparent via-green-600 to-transparent"
                  style={{
                    width: '16.66%',
                    left: `${i * 16.66}%`,
                    opacity: i % 2 === 0 ? 0.2 : 0.05
                  }}
                />
              ))}
            </div>

            {/* Field markings - Simplified */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="8" y="20" width="84" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
              
              {/* Center line */}
              <line x1="50" y1="20" x2="50" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
              
              {/* Center circle */}
              <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
              
              {/* Goal areas - Smaller */}
              <rect x="8" y="40" width="6" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
              <rect x="86" y="40" width="6" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
              
              {/* Penalty areas */}
              <rect x="8" y="32" width="16" height="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
              <rect x="76" y="32" width="16" height="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4"/>
            </svg>
          </div>

          {/* Ball - 365scores style */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-linear z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div 
              className="w-3 h-3 bg-white rounded-full ball-flash"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #ffffff, #f0f0f0)'
              }}
            />
          </div>

          {/* Team possession overlay - 365scores style */}
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm rounded-md px-4 py-2 text-center possession-fade-in border border-white/20">
              <div className="text-white text-sm font-medium mb-1 opacity-90">
                Ball Safe
              </div>
              <div className="flex items-center justify-center gap-2">
                {ballPossession === 'home' && homeTeamData?.logo && (
                  <img 
                    src={homeTeamData.logo} 
                    alt={homeTeamData.name}
                    className="w-4 h-4 object-contain"
                  />
                )}
                {ballPossession === 'away' && awayTeamData?.logo && (
                  <img 
                    src={awayTeamData.logo} 
                    alt={awayTeamData.name}
                    className="w-4 h-4 object-contain"
                  />
                )}
                <div className="text-white text-sm font-bold tracking-wide">
                  {ballPossession === 'home' 
                    ? getTeamDisplayName('home') 
                    : getTeamDisplayName('away')
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyLiveAction;
