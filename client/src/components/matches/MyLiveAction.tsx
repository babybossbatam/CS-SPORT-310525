import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        let newX = prev.x + ballDirection.dx * 1.2;
        let newY = prev.y + ballDirection.dy * 1.2;

        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;

        // Determine ball possession based on position
        if (newX < 50) {
          setBallPossession('home');
        } else {
          setBallPossession('away');
        }

        // Boundary checks with realistic bouncing
        if (newX <= 8 || newX >= 92) {
          newDx = -newDx + (Math.random() - 0.5) * 0.3;
          newX = Math.max(8, Math.min(92, newX));
        }

        if (newY <= 20 || newY >= 80) {
          newDy = -newDy + (Math.random() - 0.5) * 0.3;
          newY = Math.max(20, Math.min(80, newY));
        }

        // Add natural movement variation
        newDx += (Math.random() - 0.5) * 0.1;
        newDy += (Math.random() - 0.5) * 0.1;

        // Limit speed for realistic movement
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 2) {
          newDx = (newDx / speed) * 2;
          newDy = (newDy / speed) * 2;
        }

        setBallDirection({ dx: newDx, dy: newDy });

        return { x: newX, y: newY };
      });
    }, 200);

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
      }, 4000);

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
            y = Math.random() > 0.5 ? 25 : 75;
          } else {
            x = isHomeTeam ? 60 + Math.random() * 20 : 20 + Math.random() * 20;
            y = 30 + Math.random() * 40;
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
      <Card className={`w-full ${className} bg-gradient-to-br from-green-600 to-green-800 border-0 text-white`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-white text-sm">Loading live action...</div>
        </CardContent>
      </Card>
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
      <Card className={`w-full ${className} bg-gradient-to-br from-gray-600 to-gray-800 border-0 text-white`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-white text-sm opacity-80">
            {matchId ? `No match data found` : 'No match selected'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLive) {
    return (
      <Card className={`w-full ${className} bg-gradient-to-br from-gray-600 to-gray-800 border-0 text-white`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-white text-sm mb-2 opacity-80">Match not live</p>
            <p className="text-xs text-white opacity-60">
              {homeTeamData?.name} vs {awayTeamData?.name}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className} bg-gradient-to-br from-green-600 to-green-800 border-0 text-white overflow-hidden`}>
      {/* Header */}
      <CardHeader className="pb-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">Live Action</span>
          </div>
          <Badge variant="secondary" className="text-xs px-3 py-1 bg-red-500 text-white animate-pulse border-0">
            LIVE
          </Badge>
        </div>
      </CardHeader>

      {/* Football Field */}
      <CardContent className="p-4 pb-2">
        <div className="relative w-full h-80 bg-gradient-to-br from-green-800 via-green-700 to-green-800 rounded-lg overflow-hidden border-2 border-white/20">

          {/* Field Pattern */}
          <div className="absolute inset-0">
            {/* Grass pattern */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full bg-gradient-to-r from-transparent via-green-600 to-transparent"
                  style={{
                    width: '12.5%',
                    left: `${i * 12.5}%`,
                    opacity: i % 2 === 0 ? 0.3 : 0.1
                  }}
                />
              ))}
            </div>

            {/* Field markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>

              {/* Center line */}
              <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>

              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>

              {/* Goal areas */}
              <rect x="5" y="35" width="8" height="30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>
              <rect x="87" y="35" width="8" height="30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>

              {/* Penalty areas */}
              <rect x="5" y="25" width="18" height="50" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>
              <rect x="77" y="25" width="18" height="50" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3"/>
            </svg>
          </div>

          {/* Ball */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-linear z-30"
            style={{
              left:`${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div 
              className="w-4 h-4 bg-white rounded-full shadow-lg"
              style={{
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                background: 'radial-gradient(circle at 30% 30%, #ffffff, #f0f0f0)'
              }}
            />
          </div>

          {/* Current Event Overlay */}
          {currentEvent && (
            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-4 text-center">
                <div className="text-white text-lg font-semibold mb-1">
                  {ballPossession === 'home' ? 'Ball Safe' : 'Ball Safe'}
                </div>
                <div className="text-white text-xl font-bold">
                  {ballPossession === 'home' 
                    ? getTeamDisplayName('home') 
                    : getTeamDisplayName('away')
                  }
                </div>
              </div>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;