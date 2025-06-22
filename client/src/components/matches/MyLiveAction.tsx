
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

interface PlayerPosition {
  id: string;
  team: 'home' | 'away';
  x: number;
  y: number;
  number?: string;
  name?: string;
  isActive?: boolean;
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
  const [halftimeFlash, setHalftimeFlash] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>('');
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([]);
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [ballPossession, setBallPossession] = useState<'home' | 'away' | null>('home');

  // Determine if match is currently live
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  // Initialize player positions for 365scores style
  useEffect(() => {
    if (isLive && displayMatch) {
      const homePositions: PlayerPosition[] = [
        // Home team formation (4-4-2)
        { id: 'h1', team: 'home', x: 15, y: 50, number: '1', name: 'GK' },
        { id: 'h2', team: 'home', x: 25, y: 25, number: '2', name: 'RB' },
        { id: 'h3', team: 'home', x: 25, y: 40, number: '5', name: 'CB' },
        { id: 'h4', team: 'home', x: 25, y: 60, number: '4', name: 'CB' },
        { id: 'h5', team: 'home', x: 25, y: 75, number: '3', name: 'LB' },
        { id: 'h6', team: 'home', x: 40, y: 30, number: '6', name: 'RM' },
        { id: 'h7', team: 'home', x: 40, y: 45, number: '8', name: 'CM' },
        { id: 'h8', team: 'home', x: 40, y: 55, number: '10', name: 'CM' },
        { id: 'h9', team: 'home', x: 40, y: 70, number: '7', name: 'LM' },
        { id: 'h10', team: 'home', x: 55, y: 40, number: '9', name: 'ST' },
        { id: 'h11', team: 'home', x: 55, y: 60, number: '11', name: 'ST' }
      ];

      const awayPositions: PlayerPosition[] = [
        // Away team formation (4-4-2)
        { id: 'a1', team: 'away', x: 85, y: 50, number: '1', name: 'GK' },
        { id: 'a2', team: 'away', x: 75, y: 75, number: '2', name: 'LB' },
        { id: 'a3', team: 'away', x: 75, y: 60, number: '5', name: 'CB' },
        { id: 'a4', team: 'away', x: 75, y: 40, number: '4', name: 'CB' },
        { id: 'a5', team: 'away', x: 75, y: 25, number: '3', name: 'RB' },
        { id: 'a6', team: 'away', x: 60, y: 70, number: '6', name: 'LM' },
        { id: 'a7', team: 'away', x: 60, y: 55, number: '8', name: 'CM' },
        { id: 'a8', team: 'away', x: 60, y: 45, number: '10', name: 'CM' },
        { id: 'a9', team: 'away', x: 60, y: 30, number: '7', name: 'RM' },
        { id: 'a10', team: 'away', x: 45, y: 60, number: '9', name: 'ST' },
        { id: 'a11', team: 'away', x: 45, y: 40, number: '11', name: 'ST' }
      ];

      setPlayerPositions([...homePositions, ...awayPositions]);
    }
  }, [isLive, displayMatch]);

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
            await generatePlayByPlayEvents(liveMatch);
            setLastUpdate(new Date().toLocaleTimeString());
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

            const currentStatus = currentMatch.fixture?.status?.short;
            if (currentStatus === 'HT' && previousStatus && previousStatus !== 'HT') {
              setHalftimeFlash(true);
              setTimeout(() => {
                setHalftimeFlash(false);
              }, 3000);
            }
            
            setPreviousStatus(currentStatus);

            if (currentElapsed > previousElapsed) {
              await generatePlayByPlayEvents(currentMatch, true);
            }

            setLastUpdate(new Date().toLocaleTimeString());
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

      const eventCycleInterval = setInterval(() => {
        const recentEvents = playByPlayEvents.slice(0, 3);
        const currentIndex = recentEvents.findIndex(e => e.id === currentEvent?.id);
        const nextIndex = (currentIndex + 1) % recentEvents.length;
        setCurrentEvent(recentEvents[nextIndex]);
      }, 3000);

      return () => clearInterval(eventCycleInterval);
    }
  }, [playByPlayEvents, currentEvent]);

  // Enhanced ball movement animation with 365scores style
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballDirection.dx * 1.5;
        let newY = prev.y + ballDirection.dy * 1.5;
        
        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;
        
        // Ball possession logic
        const nearHomePlayer = playerPositions.find(p => 
          p.team === 'home' && 
          Math.abs(p.x - newX) < 8 && 
          Math.abs(p.y - newY) < 8
        );
        
        const nearAwayPlayer = playerPositions.find(p => 
          p.team === 'away' && 
          Math.abs(p.x - newX) < 8 && 
          Math.abs(p.y - newY) < 8
        );

        if (nearHomePlayer) {
          setBallPossession('home');
          setActivePlayers([nearHomePlayer.id]);
        } else if (nearAwayPlayer) {
          setBallPossession('away');
          setActivePlayers([nearAwayPlayer.id]);
        } else {
          setActivePlayers([]);
        }

        // Generate events based on ball position
        const isNearGoal = (newX <= 15 || newX >= 85) && (newY >= 35 && newY <= 65);
        
        if (isNearGoal && Math.random() < 0.008) {
          const eventType = Math.random() < 0.3 ? 'goal' : Math.random() < 0.6 ? 'shot' : 'save';
          const team = newX <= 50 ? 'away' : 'home';
          
          const newEvent: PlayByPlayEvent = {
            id: `live_event_${Date.now()}`,
            minute: elapsed,
            team,
            type: eventType as any,
            player: nearHomePlayer?.name || nearAwayPlayer?.name || 'Player',
            description: eventType === 'goal' ? 'GOAL!' : eventType === 'shot' ? 'Shot on target' : 'Great save',
            timestamp: Date.now(),
            isRecent: true,
            x: newX,
            y: newY
          };
          
          setPlayByPlayEvents(prev => [newEvent, ...prev.slice(0, 4)]);
          setCurrentEvent(newEvent);
        }
        
        // Boundary checks with realistic bouncing
        if (newX <= 8 || newX >= 92) {
          newDx = -newDx + (Math.random() - 0.5) * 0.4;
          newX = Math.max(8, Math.min(92, newX));
        }
        
        if (newY <= 20 || newY >= 80) {
          newDy = -newDy + (Math.random() - 0.5) * 0.4;
          newY = Math.max(20, Math.min(80, newY));
        }
        
        // Add natural movement variation
        newDx += (Math.random() - 0.5) * 0.15;
        newDy += (Math.random() - 0.5) * 0.15;
        
        // Limit speed for realistic movement
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 2.5) {
          newDx = (newDx / speed) * 2.5;
          newDy = (newDy / speed) * 2.5;
        }
        
        setBallDirection({ dx: newDx, dy: newDy });
        
        // Enhanced ball trail
        setBallTrail(prev => {
          const newTrail = [...prev, { x: newX, y: newY, timestamp: Date.now() }];
          return newTrail.slice(-15);
        });
        
        return { x: newX, y: newY };
      });
    }, 150);

    return () => clearInterval(ballInterval);
  }, [isLive, elapsed, playerPositions]);

  // Move ball to event locations when events occur
  useEffect(() => {
    if (currentEvent && currentEvent.x && currentEvent.y) {
      setBallPosition({ x: currentEvent.x, y: currentEvent.y });
      setBallTrail([]);
    }
  }, [currentEvent]);

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
            description = `${event.detail || 'Yellow'} card`;
          } else if (event.type === 'subst') {
            eventType = 'substitution';
            description = 'Substitution';
          } else if (event.detail?.toLowerCase().includes('corner')) {
            eventType = 'corner';
            description = 'Corner kick';
          } else if (event.detail?.toLowerCase().includes('shot')) {
            eventType = 'shot';
            description = event.detail;
          }

          let x = 50, y = 50;
          
          if (eventType === 'goal') {
            x = isHomeTeam ? 90 : 10;
            y = 45 + Math.random() * 10;
          } else if (eventType === 'corner') {
            x = isHomeTeam ? 90 : 10;
            y = Math.random() > 0.5 ? 25 : 75;
          } else if (eventType === 'shot') {
            x = isHomeTeam ? 75 + Math.random() * 15 : 10 + Math.random() * 15;
            y = 35 + Math.random() * 30;
          } else {
            x = isHomeTeam ? 60 + Math.random() * 25 : 15 + Math.random() * 25;
            y = 25 + Math.random() * 50;
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

  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;
  const statusData = status || displayMatch?.fixture?.status?.short;

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
    <Card className={`w-full ${className} ${
      halftimeFlash 
        ? 'bg-gradient-to-br from-orange-500 to-orange-700 animate-pulse' 
        : 'bg-gradient-to-br from-green-600 to-green-800'
    } border-0 text-white overflow-hidden transition-all duration-1000 ease-in-out`}>
      {/* Header */}
      <CardHeader className="pb-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">Live Action</span>
          </div>
          <Badge variant="secondary" className={`text-xs px-3 py-1 ${
            halftimeFlash 
              ? 'bg-orange-500 text-white animate-bounce' 
              : 'bg-red-500 text-white animate-pulse'
          } border-0 transition-all duration-500`}>
            {halftimeFlash ? 'HALFTIME' : 'LIVE'}
          </Badge>
        </div>
      </CardHeader>

      {/* Enhanced 365scores Style Football Field */}
      <CardContent className="p-4 pb-2">
        <div className={`relative w-full h-80 ${
          halftimeFlash 
            ? 'bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600' 
            : 'bg-gradient-to-br from-green-800 via-green-700 to-green-800'
        } rounded-lg overflow-hidden border-2 border-white/30 transition-all duration-1000 ease-in-out`}>
          
          {/* Field Pattern - 365scores style */}
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

            {/* Enhanced Field markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              
              {/* Center line */}
              <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              
              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.8)"/>
              
              {/* Goal areas */}
              <rect x="5" y="35" width="8" height="30" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              <rect x="87" y="35" width="8" height="30" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              
              {/* Penalty areas */}
              <rect x="5" y="25" width="18" height="50" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              <rect x="77" y="25" width="18" height="50" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              
              {/* Penalty spots */}
              <circle cx="16" cy="50" r="0.8" fill="rgba(255,255,255,0.8)"/>
              <circle cx="84" cy="50" r="0.8" fill="rgba(255,255,255,0.8)"/>
              
              {/* Corner arcs */}
              <path d="M 5 15 Q 8 15 8 18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              <path d="M 95 15 Q 92 15 92 18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              <path d="M 5 85 Q 8 85 8 82" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
              <path d="M 95 85 Q 92 85 92 82" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3"/>
            </svg>
          </div>

          {/* Player Positions - 365scores style */}
          {playerPositions.map((player) => (
            <div
              key={player.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                activePlayers.includes(player.id) ? 'scale-125 z-20' : 'scale-100 z-10'
              }`}
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
              }}
            >
              <div className={`relative w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                player.team === 'home' 
                  ? activePlayers.includes(player.id)
                    ? 'bg-blue-400 shadow-lg shadow-blue-400/50'
                    : 'bg-blue-600'
                  : activePlayers.includes(player.id)
                    ? 'bg-red-400 shadow-lg shadow-red-400/50'
                    : 'bg-red-600'
              }`}>
                <span className="text-white text-xs leading-none">
                  {player.number}
                </span>
                {activePlayers.includes(player.id) && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-white/30"></div>
                )}
              </div>
            </div>
          ))}

          {/* Live Event Markers */}
          {playByPlayEvents.slice(0, 3).map((event, index) => (
            <div 
              key={event.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
                event.id === currentEvent?.id ? 'scale-150 z-30' : 'scale-100 z-15'
              }`}
              style={{
                left: `${event.x}%`,
                top: `${event.y}%`,
                opacity: 1 - (index * 0.3)
              }}
            >
              <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white ${
                event.type === 'goal' 
                  ? 'bg-yellow-500 animate-bounce'
                  : event.team === 'home' 
                    ? 'bg-blue-500' 
                    : 'bg-red-500'
              } ${event.id === currentEvent?.id ? 'animate-pulse shadow-lg' : ''}`}>
                {getEventIcon(event.type)}
                {event.id === currentEvent?.id && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-white/40"></div>
                )}
              </div>
            </div>
          ))}

          {/* Enhanced Ball Trail with SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 25 }}>
            {ballTrail.length > 1 && ballTrail.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = ballTrail[index - 1];
              const opacity = Math.max(0.1, 0.8 - (index * 0.05));
              const strokeWidth = Math.max(1, 4 - (index * 0.2));
              
              return (
                <line
                  key={`trail-line-${index}`}
                  x1={`${prevPoint.x}%`}
                  y1={`${prevPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))'
                  }}
                />
              );
            })}
          </svg>

          {/* Enhanced Ball with 365scores effects */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
              zIndex: 30
            }}
          >
            {/* Multi-layered glow effect */}
            <div className="absolute w-8 h-8 rounded-full bg-white opacity-15 animate-ping" 
                 style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}></div>
            <div className="absolute w-6 h-6 rounded-full bg-white opacity-25" 
                 style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}></div>
            
            {/* Ball core with enhanced styling */}
            <div 
              className="relative w-4 h-4 bg-white rounded-full shadow-2xl"
              style={{
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 24px rgba(255, 255, 255, 0.6), 0 0 36px rgba(255, 255, 255, 0.3)',
                background: 'radial-gradient(circle at 30% 30%, #ffffff, #f0f0f0, #e0e0e0)'
              }}
            >
              {/* Ball pattern lines */}
              <div className="absolute inset-0 rounded-full">
                <div className="absolute w-full h-0.5 bg-gray-400 opacity-50 top-1/2 transform -translate-y-1/2 rotate-45"></div>
                <div className="absolute w-full h-0.5 bg-gray-400 opacity-50 top-1/2 transform -translate-y-1/2 -rotate-45"></div>
              </div>
              {/* Ball highlight */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
            </div>
          </div>

          {/* Ball possession indicator */}
          {ballPossession && (
            <div className="absolute top-2 left-2 z-40">
              <div className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                ballPossession === 'home' ? 'bg-blue-600' : 'bg-red-600'
              } backdrop-blur-sm bg-opacity-90`}>
                Ball: {getTeamDisplayName(ballPossession)}
              </div>
            </div>
          )}

          {/* Current Event Display Overlay */}
          {currentEvent && (
            <div className="absolute top-2 right-2 z-40">
              <div className={`px-3 py-2 rounded-lg text-white backdrop-blur-sm ${
                currentEvent.type === 'goal' 
                  ? 'bg-yellow-600/90 animate-bounce'
                  : currentEvent.team === 'home'
                    ? 'bg-blue-600/90'
                    : 'bg-red-600/90'
              } border border-white/30`}>
                <div className="text-xs font-bold">
                  {currentEvent.description}
                </div>
                <div className="text-xs opacity-80">
                  {currentEvent.player} • {currentEvent.minute}'
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Score Display */}
        <div className="mt-4 flex items-center justify-center">
          <div className={`${
            halftimeFlash 
              ? 'bg-orange-500/40 border border-orange-400/60' 
              : 'bg-black/30'
          } rounded-full px-6 py-3 backdrop-blur-sm transition-all duration-500`}>
            <div className="flex items-center gap-6 text-white">
              <div className="flex items-center gap-3">
                <img 
                  src={homeTeamData?.logo} 
                  alt={homeTeamData?.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
                <span className="text-sm font-medium">
                  {homeTeamData?.code || homeTeamData?.name?.substring(0, 3).toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-3 px-4">
                <span className="text-2xl font-bold">{displayMatch?.goals?.home || 0}</span>
                <span className="text-white/60">-</span>
                <span className="text-2xl font-bold">{displayMatch?.goals?.away || 0}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {awayTeamData?.code || awayTeamData?.name?.substring(0, 3).toUpperCase()}
                </span>
                <img 
                  src={awayTeamData?.logo} 
                  alt={awayTeamData?.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
              </div>
            </div>
            
            <div className="text-center mt-2">
              <span className={`text-sm font-medium ${
                halftimeFlash 
                  ? 'text-orange-200 animate-pulse' 
                  : 'text-white/80'
              } transition-colors duration-500`}>
                {statusData === 'HT' ? 'HALFTIME' : `${elapsed}'`}
              </span>
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
