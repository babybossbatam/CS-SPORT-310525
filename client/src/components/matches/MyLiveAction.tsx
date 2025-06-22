import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MyLiveActionProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
}

interface LiveEvent {
  id: string;
  minute: number;
  team: 'home' | 'away';
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'corner' | 'offside';
  player: string;
  description: string;
  x: number;
  y: number;
}

interface PlayerPosition {
  id: string;
  team: 'home' | 'away';
  x: number;
  y: number;
  number: string;
  isActive?: boolean;
}

const MyLiveAction: React.FC<MyLiveActionProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "" 
}) => {
  const [matchData, setMatchData] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([]);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [ballPossession, setBallPossession] = useState<'home' | 'away'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<LiveEvent | null>(null);

  // Check if match is live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

  // Initialize player formations (4-4-2)
  useEffect(() => {
    const homeFormation: PlayerPosition[] = [
      // Home team (blue) - defending left side
      { id: 'h1', team: 'home', x: 10, y: 50, number: '1' }, // GK
      { id: 'h2', team: 'home', x: 25, y: 20, number: '2' }, // RB
      { id: 'h3', team: 'home', x: 25, y: 35, number: '5' }, // CB
      { id: 'h4', team: 'home', x: 25, y: 65, number: '4' }, // CB
      { id: 'h5', team: 'home', x: 25, y: 80, number: '3' }, // LB
      { id: 'h6', team: 'home', x: 45, y: 25, number: '6' }, // RM
      { id: 'h7', team: 'home', x: 45, y: 45, number: '8' }, // CM
      { id: 'h8', team: 'home', x: 45, y: 55, number: '10' }, // CM
      { id: 'h9', team: 'home', x: 45, y: 75, number: '7' }, // LM
      { id: 'h10', team: 'home', x: 65, y: 40, number: '9' }, // ST
      { id: 'h11', team: 'home', x: 65, y: 60, number: '11' } // ST
    ];

    const awayFormation: PlayerPosition[] = [
      // Away team (red) - defending right side
      { id: 'a1', team: 'away', x: 90, y: 50, number: '1' }, // GK
      { id: 'a2', team: 'away', x: 75, y: 80, number: '2' }, // LB
      { id: 'a3', team: 'away', x: 75, y: 65, number: '5' }, // CB
      { id: 'a4', team: 'away', x: 75, y: 35, number: '4' }, // CB
      { id: 'a5', team: 'away', x: 75, y: 20, number: '3' }, // RB
      { id: 'a6', team: 'away', x: 55, y: 75, number: '6' }, // LM
      { id: 'a7', team: 'away', x: 55, y: 55, number: '8' }, // CM
      { id: 'a8', team: 'away', x: 55, y: 45, number: '10' }, // CM
      { id: 'a9', team: 'away', x: 55, y: 25, number: '7' }, // RM
      { id: 'a10', team: 'away', x: 35, y: 60, number: '9' }, // ST
      { id: 'a11', team: 'away', x: 35, y: 40, number: '11' } // ST
    ];

    setPlayerPositions([...homeFormation, ...awayFormation]);
  }, []);

  // Fetch match data and events from RapidAPI
  useEffect(() => {
    if (!matchId || !isLive) return;

    const fetchMatchData = async () => {
      setIsLoading(true);
      try {
        // Fetch match details
        const matchResponse = await fetch(`/api/fixtures?ids=${matchId}`);
        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          if (matchData.length > 0) {
            setMatchData(matchData[0]);
          }
        }

        // Fetch match events
        const eventsResponse = await fetch(`/api/fixtures/${matchId}/events`);
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          processEvents(events);
        }

      } catch (error) {
        console.error('Error fetching match data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchData();

    // Poll for updates every 10 seconds during live matches
    const interval = setInterval(fetchMatchData, 10000);
    return () => clearInterval(interval);
  }, [matchId, isLive]);

  // Process events from RapidAPI and convert to our format
  const processEvents = (events: any[]) => {
    const processedEvents: LiveEvent[] = events
      .filter(event => event.time?.elapsed <= (matchData?.fixture?.status?.elapsed || 90))
      .slice(-5) // Get last 5 events
      .map((event, index) => {
        const isHomeTeam = event.team?.id === matchData?.teams?.home?.id;

        let eventType: LiveEvent['type'] = 'corner';
        let x = 50, y = 50;

        // Map event types
        if (event.type === 'Goal') {
          eventType = 'goal';
          x = isHomeTeam ? 85 : 15;
          y = 45 + Math.random() * 10;
        } else if (event.type === 'Card') {
          eventType = event.detail?.includes('Red') ? 'red_card' : 'yellow_card';
          x = isHomeTeam ? 60 + Math.random() * 20 : 20 + Math.random() * 20;
          y = 30 + Math.random() * 40;
        } else if (event.type === 'subst') {
          eventType = 'substitution';
          x = isHomeTeam ? 40 : 60;
          y = 20 + Math.random() * 60;
        }

        return {
          id: `event_${event.time?.elapsed}_${index}`,
          minute: event.time?.elapsed || 0,
          team: isHomeTeam ? 'home' : 'away',
          type: eventType,
          player: event.player?.name || 'Player',
          description: event.detail || event.type,
          x,
          y
        };
      });

    setLiveEvents(processedEvents);
    if (processedEvents.length > 0) {
      setCurrentEvent(processedEvents[0]);
    }
  };

  // Ball movement animation
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + (Math.random() - 0.5) * 3;
        let newY = prev.y + (Math.random() - 0.5) * 3;

        // Keep ball within field bounds
        newX = Math.max(15, Math.min(85, newX));
        newY = Math.max(25, Math.min(75, newY));

        // Simulate possession change
        if (Math.random() < 0.1) {
          setBallPossession(prev => prev === 'home' ? 'away' : 'home');
        }

        return { x: newX, y: newY };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isLive]);

  // Cycle through events
  useEffect(() => {
    if (liveEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentEvent(prev => {
        const currentIndex = liveEvents.findIndex(e => e.id === prev?.id);
        const nextIndex = (currentIndex + 1) % liveEvents.length;
        return liveEvents[nextIndex];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [liveEvents]);

  const getEventIcon = (type: LiveEvent['type']) => {
    const icons = {
      goal: "⚽",
      yellow_card: "🟨",
      red_card: "🟥",
      substitution: "🔄",
      corner: "📐",
      offside: "🚩"
    };
    return icons[type] || "⚽";
  };

  const getTeamName = (team: 'home' | 'away') => {
    if (team === 'home') {
      return homeTeam?.code || homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOME';
    }
    return awayTeam?.code || awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWAY';
  };

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
              {homeTeam?.name} vs {awayTeam?.name}
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
        <div className="relative w-full h-80 bg-gradient-to-br from-green-800 via-green-700 to-green-800 rounded-lg overflow-hidden border-2 border-white/30">

          {/* Field markings */}
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
          </svg>

          {/* Player positions */}
          {playerPositions.map((player) => (
            <div
              key={player.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
              }}
            >
              <div className={`relative w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${
                player.team === 'home' ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                <span className="text-white text-xs leading-none">
                  {player.number}
                </span>
              </div>
            </div>
          ))}

          {/* Live events on field */}
          {liveEvents.map((event, index) => (
            <div 
              key={event.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                event.id === currentEvent?.id ? 'scale-125 z-30' : 'scale-100 z-15'
              }`}
              style={{
                left: `${event.x}%`,
                top: `${event.y}%`,
                opacity: 1 - (index * 0.2)
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
              </div>
            </div>
          ))}

          {/* Ball */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-linear z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-lg border border-gray-300"></div>
          </div>

          {/* Ball possession indicator */}
          <div className="absolute top-2 left-2 z-40">
            <div className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
              ballPossession === 'home' ? 'bg-blue-600' : 'bg-red-600'
            } backdrop-blur-sm bg-opacity-90`}>
              Ball: {getTeamName(ballPossession)}
            </div>
          </div>

          {/* Current event display */}
          {currentEvent && (
            <div className="absolute top-2 right-2 z-40">
              <div className={`px-3 py-2 rounded-lg text-white backdrop-blur-sm ${
                currentEvent.type === 'goal' 
                  ? 'bg-yellow-600/90'
                  : currentEvent.team === 'home'
                    ? 'bg-blue-600/90'
                    : 'bg-red-600/90'
              } border border-white/30`}>
                <div className="text-xs font-bold">
                  {getEventIcon(currentEvent.type)} {currentEvent.description}
                </div>
                <div className="text-xs opacity-80">
                  {currentEvent.player} • {currentEvent.minute}'
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Score display */}
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-black/30 rounded-full px-6 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-6 text-white">
              <div className="flex items-center gap-3">
                <img 
                  src={homeTeam?.logo} 
                  alt={homeTeam?.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
                <span className="text-sm font-medium">
                  {getTeamName('home')}
                </span>
              </div>

              <div className="flex items-center gap-3 px-4">
                <span className="text-2xl font-bold">{matchData?.goals?.home || 0}</span>
                <span className="text-white/60">-</span>
                <span className="text-2xl font-bold">{matchData?.goals?.away || 0}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {getTeamName('away')}
                </span>
                <img 
                  src={awayTeam?.logo} 
                  alt={awayTeam?.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
              </div>
            </div>

            <div className="text-center mt-2">
              <span className="text-sm font-medium text-white/80">
                {status === 'HT' ? 'HALFTIME' : `${matchData?.fixture?.status?.elapsed || 0}'`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;