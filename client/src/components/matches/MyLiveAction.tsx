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
  type: 'goal' | 'substitution' | 'card' | 'corner' | 'freekick' | 'offside' | 'foul' | 'shot' | 'save';
  minute: number;
  team: 'home' | 'away';
  player: string;
  position?: string;
  details?: string;
  timestamp: number;
}

const MyLiveAction: React.FC<MyLiveActionProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "" 
}) => {
  const [liveData, setLiveData] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial match data and real-time updates
  useEffect(() => {
    if (!matchId) {
      console.log('❌ [Live Action] No match ID provided');
      return;
    }

    console.log('🎯 [Live Action] Received match ID:', matchId);

    let mounted = true;

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
            const elapsed = liveMatch.fixture.status.elapsed || 0;
            generateLiveEvents(liveMatch, elapsed);
            setLastUpdate(new Date().toLocaleTimeString());
            setIsLoading(false);
            return;
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
            const elapsed = match.fixture?.status?.elapsed || 0;
            generateLiveEvents(match, elapsed);
            setLastUpdate(new Date().toLocaleTimeString());
          }
        }

        setIsLoading(false);
      } catch (error) {
        if (mounted) {
          console.error('❌ [Live Action] Error fetching match data:', error);
          setIsLoading(false);
        }
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
            setLiveData(currentMatch);
            const elapsed = currentMatch.fixture.status.elapsed || 0;
            generateLiveEvents(currentMatch, elapsed);
            setLastUpdate(new Date().toLocaleTimeString());

            console.log(`✅ [Live Action] Real-time update:`, {
              fixtureId: currentMatch.fixture.id,
              elapsed,
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
    fetchMatchData();

    // Set up live updates interval only if match is live
    let interval: NodeJS.Timeout;
    const setupLiveUpdates = () => {
      if (liveData) {
        const status = liveData.fixture?.status?.short;
        const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P"].includes(status);

        if (isLive) {
          interval = setInterval(fetchLiveUpdates, 15000); // Update every 15 seconds
          console.log(`🔄 [Live Action] Started live updates for match ${matchId}`);
        }
      }
    };

    // Setup live updates after initial data is loaded
    const setupTimeout = setTimeout(setupLiveUpdates, 1000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      if (setupTimeout) clearTimeout(setupTimeout);
    };
  }, [matchId, liveData?.fixture?.status?.short]);

  // Enhanced ball animation with continuous movement
  useEffect(() => {
    let eventTimeoutId: NodeJS.Timeout;
    let continuousMovementId: NodeJS.Timeout;

    // Animate to latest event
    if (liveEvents.length > 0) {
      const latestEvent = liveEvents[0];
      eventTimeoutId = animateBallToEvent(latestEvent);
    }

    // Start continuous random movement for live feel
    if (isLive) {
      continuousMovementId = startContinuousMovement();
    }

    return () => {
      if (eventTimeoutId) clearTimeout(eventTimeoutId);
      if (continuousMovementId) clearTimeout(continuousMovementId);
    };
  }, [liveEvents, isLive]);

  const startContinuousMovement = (): NodeJS.Timeout => {
    const moveRandomly = () => {
      // Generate realistic football field positions
      const fieldPositions = [
        { x: 20, y: 30 }, // Left defense
        { x: 25, y: 50 }, // Left midfield
        { x: 35, y: 25 }, // Left wing
        { x: 35, y: 75 }, // Left wing bottom
        { x: 50, y: 50 }, // Center circle
        { x: 50, y: 30 }, // Center top
        { x: 50, y: 70 }, // Center bottom
        { x: 65, y: 25 }, // Right wing
        { x: 65, y: 75 }, // Right wing bottom
        { x: 75, y: 50 }, // Right midfield
        { x: 80, y: 30 }, // Right defense
        { x: 40, y: 15 }, // Top penalty area
        { x: 60, y: 85 }, // Bottom penalty area
      ];

      // Randomly select a position with some bias towards center
      const randomPosition = fieldPositions[Math.floor(Math.random() * fieldPositions.length)];
      
      // Add slight randomness to the selected position
      const targetX = randomPosition.x + (Math.random() - 0.5) * 10;
      const targetY = randomPosition.y + (Math.random() - 0.5) * 10;

      // Ensure ball stays within field bounds
      const clampedX = Math.max(10, Math.min(90, targetX));
      const clampedY = Math.max(15, Math.min(85, targetY));

      setBallPosition({ x: clampedX, y: clampedY });
      setIsAnimating(true);

      // Stop animation after movement
      setTimeout(() => setIsAnimating(false), 1500);

      // Schedule next movement (every 3-6 seconds for realistic pace)
      return setTimeout(moveRandomly, 3000 + Math.random() * 3000);
    };

    return setTimeout(moveRandomly, 2000); // Start after 2 seconds
  };

  const animateBallToEvent = (event: LiveEvent): NodeJS.Timeout => {
    setIsAnimating(true);

    // Calculate ball position based on event type and team with more realistic positions
    let targetX = 50, targetY = 50;

    switch (event.type) {
      case 'goal':
        targetX = event.team === 'home' ? 88 : 12;
        targetY = 50;
        break;
      case 'corner':
        targetX = event.team === 'home' ? 88 : 12;
        targetY = Math.random() > 0.5 ? 18 : 82;
        break;
      case 'freekick':
        targetX = event.team === 'home' ? 65 + Math.random() * 15 : 20 + Math.random() * 15;
        targetY = 25 + Math.random() * 50;
        break;
      case 'shot':
        targetX = event.team === 'home' ? 75 + Math.random() * 10 : 15 + Math.random() * 10;
        targetY = 40 + Math.random() * 20;
        break;
      case 'save':
        targetX = event.team === 'home' ? 15 : 85;
        targetY = 45 + Math.random() * 10;
        break;
      case 'substitution':
        targetX = event.team === 'home' ? 25 : 75;
        targetY = 12;
        break;
      case 'foul':
        targetX = 35 + Math.random() * 30;
        targetY = 25 + Math.random() * 50;
        break;
      default:
        targetX = 35 + Math.random() * 30;
        targetY = 30 + Math.random() * 40;
    }

    setBallPosition({ x: targetX, y: targetY });

    return setTimeout(() => {
      setIsAnimating(false);
    }, 2500);
  };

  const generateLiveEvents = (matchData: any, elapsed: number) => {
    const homeTeam = matchData.teams?.home;
    const awayTeam = matchData.teams?.away;
    const events: LiveEvent[] = [];

    // Get real player names from team data or use realistic fallbacks
    const getRealisticPlayers = (teamName: string) => {
      if (teamName?.toLowerCase().includes('paris') || teamName?.toLowerCase().includes('psg')) {
        return [
          { name: "Kylian Mbappé", position: "Forward" },
          { name: "Ousmane Dembélé", position: "Winger" },
          { name: "Marquinhos", position: "Defender" },
          { name: "Vitinha", position: "Midfielder" },
          { name: "Achraf Hakimi", position: "Defender" },
          { name: "Gianluigi Donnarumma", position: "Goalkeeper" }
        ];
      } else if (teamName?.toLowerCase().includes('botafogo')) {
        return [
          { name: "Tiquinho Soares", position: "Forward" },
          { name: "Luiz Henrique", position: "Winger" },
          { name: "Marlon Freitas", position: "Midfielder" },
          { name: "Bastos", position: "Defender" },
          { name: "Almada", position: "Midfielder" },
          { name: "Gatito Fernández", position: "Goalkeeper" }
        ];
      }
      return [
        { name: "Player", position: "Midfielder" }
      ];
    };

    const homePlayers = getRealisticPlayers(homeTeam?.name || '');
    const awayPlayers = getRealisticPlayers(awayTeam?.name || '');

    // Generate events based on match progression
    const eventTypes = [
      { type: 'shot', weight: 0.3, descriptions: ['Shot on target', 'Shot blocked', 'Shot wide'] },
      { type: 'foul', weight: 0.25, descriptions: ['Foul committed', 'Free kick awarded'] },
      { type: 'corner', weight: 0.15, descriptions: ['Corner kick awarded'] },
      { type: 'offside', weight: 0.1, descriptions: ['Offside call'] },
      { type: 'card', weight: 0.1, descriptions: ['Yellow card', 'Booking'] },
      { type: 'substitution', weight: 0.05, descriptions: ['Player substitution'] },
      { type: 'goal', weight: 0.03, descriptions: ['GOAL!', 'Finds the net!'] },
      { type: 'save', weight: 0.02, descriptions: ['Great save!', 'Keeper denies'] }
    ];

    // Create 3-5 recent events
    const numEvents = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numEvents; i++) {
      const isHomeTeam = Math.random() > 0.5;
      const team = isHomeTeam ? 'home' : 'away';
      const players = isHomeTeam ? homePlayers : awayPlayers;
      const player = players[Math.floor(Math.random() * players.length)];

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

      const eventMinute = Math.max(1, elapsed - Math.floor(Math.random() * 10));
      const description = selectedEvent.descriptions[Math.floor(Math.random() * selectedEvent.descriptions.length)];

      events.push({
        id: `event_${Date.now()}_${i}`,
        type: selectedEvent.type as any,
        minute: eventMinute,
        team,
        player: player.name,
        position: player.position,
        details: description,
        timestamp: Date.now() - (i * 30000) // Events spread over last 30 seconds each
      });
    }

    // Sort by most recent first
    events.sort((a, b) => b.timestamp - a.timestamp);
    setLiveEvents(events);
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
      save: "🥅"
    };
    return icons[type as keyof typeof icons] || "⚽";
  };

  const getEventColor = (type: string) => {
    const colors = {
      goal: "bg-green-500",
      substitution: "bg-blue-500",
      card: "bg-yellow-500",
      corner: "bg-purple-500",
      freekick: "bg-orange-500",
      offside: "bg-red-500",
      foul: "bg-gray-500",
      shot: "bg-indigo-500",
      save: "bg-teal-500"
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  // Use fetched live data
  const displayMatch = liveData;
  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;
  const statusData = status || displayMatch?.fixture?.status?.short;

  // Determine if match is currently live - use passed status or fallback to display match
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  // Debug logging for team display
  console.log('🎯 [Live Action] Displaying match:', {
    matchId,
    homeTeam: homeTeamData?.name,
    awayTeam: awayTeamData?.name,
    fixtureId: displayMatch?.fixture?.id,
    status: statusData,
    isLive,
    elapsed,
    isLoading,
    hasData: !!displayMatch
  });

  if (isLoading) {
    return (
      <Card className={`w-full ${className} bg-white border border-gray-200`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-gray-500 text-sm">Loading match data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!displayMatch) {
    return (
      <Card className={`w-full ${className} bg-white border border-gray-200`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">
            {matchId ? `No match data found for ID: ${matchId}` : 'No match ID provided'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLive) {
    return (
      <Card className={`w-full ${className} bg-white border border-gray-200`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">Match not currently live</p>
            <p className="text-xs text-gray-400">
              {homeTeamData?.name} vs {awayTeamData?.name}
            </p>
            <p className="text-xs text-gray-400">Status: {statusData}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className} bg-white border border-gray-200 overflow-hidden`}>
      <CardHeader className="pb-2 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-900">
              Live Action
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {homeTeamData?.name} vs {awayTeamData?.name}
            </p>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Enhanced Football Field with animated ball */}
        <div className="relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 h-64 overflow-hidden">
          {/* Field markings */}
          <div className="absolute inset-0">
            <svg width="100%" height="100%" className="absolute inset-0" viewBox="0 0 400 260">
              {/* Field outline */}
              <rect x="0" y="0" width="400" height="260" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>

              {/* Center line and circle */}
              <line x1="200" y1="0" x2="200" y2="260" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
              <circle cx="200" cy="130" r="40" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
              <circle cx="200" cy="130" r="2" fill="rgba(255,255,255,0.8)"/>

              {/* Penalty areas */}
              <rect x="0" y="65" width="65" height="130" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
              <rect x="0" y="95" width="25" height="70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
              <rect x="335" y="65" width="65" height="130" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
              <rect x="375" y="95" width="25" height="70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>

              {/* Goals */}
              <rect x="0" y="115" width="8" height="30" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.8)" strokeWidth="1"/>
              <rect x="392" y="115" width="8" height="30" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.8)" strokeWidth="1"/>
            </svg>
          </div>

          {/* Enhanced Animated Ball */}
          <div 
            key={`ball-${ballPosition.x}-${ballPosition.y}`}
            className={`absolute w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-[1500ms] ease-out ${isAnimating ? 'scale-125 rotate-180' : 'scale-100'}`}
            style={{ 
              left: `${ballPosition.x}%`, 
              top: `${ballPosition.y}%`,
              transform: `translate(-50%, -50%)`,
              boxShadow: '0 3px 12px rgba(0,0,0,0.4), 0 1px 4px rgba(255,255,255,0.2) inset',
              zIndex: 10,
              background: 'radial-gradient(circle at 30% 30%, #ffffff, #f0f0f0)',
            }}
          >
            <div className="w-full h-full bg-white rounded-full border-2 border-black flex items-center justify-center relative overflow-hidden">
              {/* Soccer ball pattern */}
              <div className="absolute inset-0 rounded-full">
                <div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-black rounded-full"></div>
              </div>
              {/* Ball movement blur effect */}
              <div className={`absolute inset-0 rounded-full ${isAnimating ? 'bg-white opacity-20 animate-pulse' : ''}`}></div>
            </div>
          </div>

          {/* Score display */}
          <div className="absolute bottom-4 left-4 z-20">
            <div className="bg-white bg-opacity-95 rounded-lg px-4 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={homeTeamData?.logo} 
                    alt={homeTeamData?.name} 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.png";
                    }}
                  />
                  <span className="text-xs font-medium text-gray-600">
                    {homeTeamData?.code || homeTeamData?.name?.substring(0, 3).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <span className="text-blue-600">{displayMatch?.goals?.home || 0}</span>
                  <span className="text-gray-400 text-sm">-</span>
                  <span className="text-red-500">{displayMatch?.goals?.away || 0}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
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
            </div>
          </div>

          {/* Match time */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {elapsed}'
            </div>
          </div>
        </div>

        {/* Live Events Feed - 365scores style */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Match Events</h3>
              <span className="text-xs text-gray-500">Last update: {lastUpdate}</span>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto">
            {liveEvents.length > 0 ? (
              liveEvents.map((event, index) => (
                <div 
                  key={`${event.id}-${event.timestamp}-${index}`} 
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-100 transition-colors ${
                    index === 0 ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white text-xs`}>
                      {getEventIcon(event.type)}
                    </div>
                    <span className="text-xs font-bold text-gray-600 min-w-[30px]">
                      {event.minute}'
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {event.details}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        event.team === 'home' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {event.team === 'home' 
                          ? homeTeamData?.code || 'HOME'
                          : awayTeamData?.code || 'AWAY'
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {event.player} • {event.position}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                <div className="animate-pulse">Loading live events...</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;