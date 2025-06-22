
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
  x?: number; // Field position X (0-100%)
  y?: number; // Field position Y (0-100%)
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
  const [lastUpdateId, setLastUpdateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentEvent, setCurrentEvent] = useState<PlayByPlayEvent | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [ballTrail, setBallTrail] = useState<{ x: number, y: number, timestamp: number }[]>([]);
  const [ballDirection, setBallDirection] = useState({ dx: 1, dy: 0.5 });

  // Determine if match is currently live (calculate early to avoid initialization errors)
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);

  // Fetch initial match data and set up real-time updates
  useEffect(() => {
    if (!matchId) {
      console.log('❌ [Live Action] No match ID provided');
      return;
    }

    console.log('🎯 [Live Action] Received match ID:', matchId);

    let mounted = true;
    let updateInterval: NodeJS.Timeout;

    const fetchMatchData = async () => {
      try {
        setIsLoading(true);

        // First, try to get the match from live fixtures
        const liveResponse = await fetch(`/api/fixtures/live?_t=${Date.now()}`);
        if (liveResponse.ok && mounted) {
          const liveFixtures = await liveResponse.json();
          const liveMatch = liveFixtures.find((fixture: any) => 
            fixture.fixture.id === matchId
          );

          if (liveMatch && mounted) {
            console.log(`🔴 [Live Action] Found live match:`, {
              fixtureId: liveMatch.fixture.id,
              homeTeam: liveMatch.teams?.home?.name,
              awayTeam: liveMatch.teams?.away?.name,
              status: liveMatch.fixture?.status?.short,
              elapsed: liveMatch.fixture?.status?.elapsed
            });

            setLiveData(liveMatch);
            generatePlayByPlayEvents(liveMatch);
            setLastUpdate(new Date().toLocaleTimeString());
            setIsLoading(false);
            return liveMatch;
          }
        }

        // If not found in live fixtures, get from specific match endpoint
        const matchResponse = await fetch(`/api/fixtures?ids=${matchId}`);
        if (matchResponse.ok && mounted) {
          const matchData = await matchResponse.json();
          if (matchData.length > 0) {
            const match = matchData[0];
            console.log(`📊 [Live Action] Found match data:`, {
              fixtureId: match.fixture.id,
              homeTeam: match.teams?.home?.name,
              awayTeam: match.teams?.away?.name,
              status: match.fixture?.status?.short
            });

            setLiveData(match);
            generatePlayByPlayEvents(match);
            setLastUpdate(new Date().toLocaleTimeString());
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

            // Generate new events if time has progressed
            if (currentElapsed > previousElapsed) {
              generatePlayByPlayEvents(currentMatch, true);
            }

            setLastUpdate(new Date().toLocaleTimeString());

            console.log(`✅ [Live Action] Real-time update:`, {
              fixtureId: currentMatch.fixture.id,
              elapsed: currentElapsed,
              homeGoals: currentMatch.goals?.home,
              awayGoals: currentMatch.goals?.away,
              status: currentMatch.fixture?.status?.short
            });
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ [Live Action] Error fetching live updates:', error);
        }
      }
    };

    // Initial fetch
    fetchMatchData().then((match) => {
      if (match && mounted) {
        const status = match.fixture?.status?.short;
        const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

        if (isLive) {
          // Set up real-time updates every 5 seconds (faster for live feel)
          updateInterval = setInterval(fetchLiveUpdates, 5000);
          console.log(`🔄 [Live Action] Started real-time updates for match ${matchId}`);
        }
      }
    });

    return () => {
      mounted = false;
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [matchId]);

  // Auto-update current event display
  useEffect(() => {
    if (playByPlayEvents.length > 0) {
      const latestEvent = playByPlayEvents[0];
      setCurrentEvent(latestEvent);

      // Auto-cycle through recent events every 3 seconds
      const eventCycleInterval = setInterval(() => {
        const recentEvents = playByPlayEvents.slice(0, 3);
        const currentIndex = recentEvents.findIndex(e => e.id === currentEvent?.id);
        const nextIndex = (currentIndex + 1) % recentEvents.length;
        setCurrentEvent(recentEvents[nextIndex]);
      }, 3000);

      return () => clearInterval(eventCycleInterval);
    }
  }, [playByPlayEvents, currentEvent]);

  // Ball movement animation for live matches
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballDirection.dx;
        let newY = prev.y + ballDirection.dy;
        
        // Bounce off field boundaries with some randomness
        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;
        
        if (newX <= 5 || newX >= 95) {
          newDx = -newDx + (Math.random() - 0.5) * 0.3;
          newX = Math.max(5, Math.min(95, newX));
        }
        
        if (newY <= 15 || newY >= 85) {
          newDy = -newDy + (Math.random() - 0.5) * 0.3;
          newY = Math.max(15, Math.min(85, newY));
        }
        
        // Add some randomness to direction
        newDx += (Math.random() - 0.5) * 0.1;
        newDy += (Math.random() - 0.5) * 0.1;
        
        // Limit speed
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 2) {
          newDx = (newDx / speed) * 2;
          newDy = (newDy / speed) * 2;
        }
        
        setBallDirection({ dx: newDx, dy: newDy });
        
        // Update ball trail
        setBallTrail(prev => {
          const newTrail = [...prev, { x: newX, y: newY, timestamp: Date.now() }];
          // Keep only last 8 trail points
          return newTrail.slice(-8);
        });
        
        return { x: newX, y: newY };
      });
    }, 150); // Update every 150ms for smooth movement

    return () => clearInterval(ballInterval);
  }, [isLive, ballDirection]);

  // Move ball to event locations when events occur
  useEffect(() => {
    if (currentEvent && currentEvent.x && currentEvent.y) {
      setBallPosition({ x: currentEvent.x, y: currentEvent.y });
      // Clear trail when ball teleports to event
      setBallTrail([]);
    }
  }, [currentEvent]);

  const generatePlayByPlayEvents = (matchData: any, isUpdate: boolean = false) => {
    const homeTeam = matchData.teams?.home;
    const awayTeam = matchData.teams?.away;
    const elapsed = matchData.fixture?.status?.elapsed || 0;

    // Event types with realistic probabilities and field positions
    const eventTypes = [
      { 
        type: 'shot', 
        weight: 0.35, 
        descriptions: ['Shot blocked', 'Shot saved', 'Shot wide', 'Shot on target'],
        positions: { near: [75, 85, 90], far: [15, 25, 35] } // Near goal positions
      },
      { 
        type: 'attempt', 
        weight: 0.25, 
        descriptions: ['Dangerous attack', 'Close attempt', 'Effort blocked'],
        positions: { near: [70, 80, 85], far: [20, 30, 40] }
      },
      { 
        type: 'foul', 
        weight: 0.15, 
        descriptions: ['Foul committed', 'Free kick awarded', 'Handball'],
        positions: { near: [40, 50, 60], far: [40, 50, 60] } // Midfield fouls
      },
      { 
        type: 'corner', 
        weight: 0.08, 
        descriptions: ['Corner kick'],
        positions: { near: [95, 95, 95], far: [5, 5, 5] } // Corner positions
      },
      { 
        type: 'offside', 
        weight: 0.05, 
        descriptions: ['Offside'],
        positions: { near: [80, 85, 90], far: [15, 20, 25] }
      },
      { 
        type: 'card', 
        weight: 0.04, 
        descriptions: ['Yellow card', 'Caution'],
        positions: { near: [30, 50, 70], far: [30, 50, 70] }
      },
      { 
        type: 'substitution', 
        weight: 0.06, 
        descriptions: ['Substitution'],
        positions: { near: [50, 50, 50], far: [50, 50, 50] } // Sideline
      },
      { 
        type: 'goal', 
        weight: 0.02, 
        descriptions: ['GOAL!', 'Goal scored!'],
        positions: { near: [95, 95, 95], far: [5, 5, 5] } // Goal line
      }
    ];

    const players = {
      home: ['Forward', 'Midfielder', 'Defender', 'Striker', 'Winger'],
      away: ['Forward', 'Midfielder', 'Defender', 'Striker', 'Winger']
    };

    const events: PlayByPlayEvent[] = [];

    // Generate 1-3 recent events
    const numEvents = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numEvents; i++) {
      const isHomeTeam = Math.random() > 0.5;
      const team = isHomeTeam ? 'home' : 'away';
      const teamPlayers = players[team];
      const player = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];

      // Select event type based on weights
      const random = Math.random();
      let cumulativeWeight = 0;
      let selectedEvent = eventTypes[0];

      for (const eventType of eventTypes) {
        cumulativeWeight += eventType.weight;
        if (random <= cumulativeWeight) {
          selectedEvent = eventType;
          break;
        }
      }

      const eventMinute = Math.max(1, elapsed - Math.floor(Math.random() * 8));
      const description = selectedEvent.descriptions[Math.floor(Math.random() * selectedEvent.descriptions.length)];

      // Determine field position based on team and event type
      const positionType = isHomeTeam ? 'near' : 'far';
      const possibleX = selectedEvent.positions[positionType];
      const x = possibleX[Math.floor(Math.random() * possibleX.length)];
      const y = 25 + Math.random() * 50; // Random Y position in middle area

      events.push({
        id: `event_${Date.now()}_${i}`,
        minute: eventMinute,
        team,
        type: selectedEvent.type as any,
        player,
        description,
        timestamp: Date.now() - (i * 8000),
        isRecent: i === 0 && isUpdate,
        x: isHomeTeam ? x : 100 - x, // Flip X for away team
        y
      });
    }

    // Sort by most recent first
    events.sort((a, b) => b.timestamp - a.timestamp);

    if (isUpdate) {
      // Add new events to the beginning
      setPlayByPlayEvents(prev => [...events, ...prev.slice(0, 6)]);
    } else {
      setPlayByPlayEvents(events);
    }
  };

  const getEventIcon = (type: string) => {
    const icons = {
      goal: "⚽",
      substitution: "🔄",
      card: "🟨",
      corner: "📐",
      freekick: "🦵",
      offside: "🚩",
      foul: "⚠️",
      shot: "🎯",
      attempt: "⚽",
      save: "🥅"
    };
    return icons[type as keyof typeof icons] || "⚽";
  };

  const getTeamDisplayName = (team: 'home' | 'away') => {
    if (team === 'home') {
      return homeTeam?.code || homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOME';
    }
    return awayTeam?.code || awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWAY';
  };

  // Use fetched live data (displayMatch already defined above)
  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;
  const statusData = status || displayMatch?.fixture?.status?.short;
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  if (isLoading) {
    return (
      <Card className={`w-full ${className} bg-gradient-to-br from-green-600 to-green-800 border-0 text-white`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-white text-sm">Loading live action...</div>
        </CardContent>
      </Card>
    );
  }

  if (!displayMatch) {
    // If we have match ID but no data, show highlights (match likely ended)
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
        <CardContent className="flex items-center justify-center h-48">
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
        <CardContent className="flex items-center justify-center h-48">
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
          <Badge variant="secondary" className="text-xs px-3 py-1 bg-red-500 text-white border-0 animate-pulse">
            LIVE
          </Badge>
        </div>
      </CardHeader>

      {/* Football Field with Live Events */}
      <CardContent className="p-4 pb-2">
        <div className="relative w-full h-48 bg-gradient-to-r from-green-700 via-green-600 to-green-700 rounded-lg overflow-hidden border-2 border-white/20">
          {/* Field markings */}
          <div className="absolute inset-0">
            {/* Goal areas */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-16 border-2 border-white/40 border-l-0"></div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-16 border-2 border-white/40 border-r-0"></div>
            
            {/* Penalty areas */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-24 border-2 border-white/30 border-l-0"></div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-24 border-2 border-white/30 border-r-0"></div>
            
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/30 rounded-full"></div>
            
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30"></div>
            
            {/* Corner arcs */}
            <div className="absolute top-0 left-0 w-4 h-4 border-br-2 border-white/30 rounded-br-full"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-bl-2 border-white/30 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-tr-2 border-white/30 rounded-tr-full"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-tl-2 border-white/30 rounded-tl-full"></div>
          </div>

          {/* Live Event Markers */}
          {playByPlayEvents.slice(0, 4).map((event, index) => (
            <div 
              key={event.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
                event.id === currentEvent?.id ? 'scale-125 z-20' : 'scale-100 z-10'
              }`}
              style={{
                left: `${event.x}%`,
                top: `${event.y}%`,
                opacity: 1 - (index * 0.2)
              }}
            >
              <div className={`w-3 h-3 rounded-full flex items-center justify-center text-xs ${
                event.team === 'home' 
                  ? 'bg-blue-500 border-2 border-white' 
                  : 'bg-red-500 border-2 border-white'
              } ${event.id === currentEvent?.id ? 'animate-pulse' : ''}`}>
                {event.type === 'goal' ? '⚽' : '●'}
              </div>
            </div>
          ))}

          {/* Ball trail */}
          {ballTrail.map((point, index) => (
            <div
              key={`trail-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-200"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: `${Math.max(2, 6 - index)}px`,
                height: `${Math.max(2, 6 - index)}px`,
                opacity: Math.max(0.1, 0.8 - (index * 0.1)),
                zIndex: 5 + index
              }}
            />
          ))}

          {/* Live moving ball */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-150 ease-linear"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
              zIndex: 15,
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 12px rgba(255, 255, 255, 0.4)'
            }}
          >
            {/* Ball glow effect */}
            <div className="absolute inset-0 rounded-full bg-white animate-pulse opacity-60"></div>
          </div>

          {/* Ball movement line (shows current direction) */}
          {isLive && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 opacity-40"
              style={{
                left: `${ballPosition.x}%`,
                top: `${ballPosition.y}%`,
                width: '20px',
                height: '2px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
                transformOrigin: 'left center',
                transform: `translate(-50%, -50%) rotate(${Math.atan2(ballDirection.dy, ballDirection.dx) * 180 / Math.PI}deg)`,
                zIndex: 10
              }}
            />
          )}
        </div>

        {/* Current Event Display */}
        {currentEvent && (
          <div className="mt-4 bg-black/20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg">{getEventIcon(currentEvent.type)}</div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {currentEvent.description}
                  </div>
                  <div className="text-xs text-white/80">
                    {currentEvent.player} • {getTeamDisplayName(currentEvent.team)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {currentEvent.minute}'
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wide">
                  {getTeamDisplayName(currentEvent.team)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Display */}
        <div className="mt-3 flex items-center justify-center">
          <div className="bg-black/30 rounded-full px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <img 
                  src={homeTeamData?.logo} 
                  alt={homeTeamData?.name}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
                <span className="text-sm font-medium">
                  {homeTeamData?.code || homeTeamData?.name?.substring(0, 3).toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-3">
                <span className="text-xl font-bold">{displayMatch?.goals?.home || 0}</span>
                <span className="text-white/60">-</span>
                <span className="text-xl font-bold">{displayMatch?.goals?.away || 0}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {awayTeamData?.code || awayTeamData?.name?.substring(0, 3).toUpperCase()}
                </span>
                <img 
                  src={awayTeamData?.logo} 
                  alt={awayTeamData?.name}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
              </div>
            </div>
            
            <div className="text-center mt-1">
              <span className="text-xs text-white/80 font-medium">{elapsed}'</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <CardContent className="px-4 py-2 pt-0">
        <div className="text-xs text-white/60 text-center">
          Last update: {lastUpdate} • Live updates every 5s
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;
