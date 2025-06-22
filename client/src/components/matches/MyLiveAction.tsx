
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
  const [halftimeFlash, setHalftimeFlash] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>('');

  // Determine if match is currently live (calculate early to avoid initialization errors)
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  
  // Define elapsed early to avoid initialization errors in useEffect dependencies
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

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
            await generatePlayByPlayEvents(liveMatch);
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

            // Check for halftime transition
            const currentStatus = currentMatch.fixture?.status?.short;
            if (currentStatus === 'HT' && previousStatus && previousStatus !== 'HT') {
              console.log('🟠 [HALFTIME FLASH] Match just went to halftime!', {
                home: currentMatch.teams?.home?.name,
                away: currentMatch.teams?.away?.name,
                previousStatus,
                currentStatus
              });
              
              // Trigger halftime flash effect
              setHalftimeFlash(true);
              
              // Remove flash after 3 seconds with smooth transition
              setTimeout(() => {
                setHalftimeFlash(false);
              }, 3000);
            }
            
            setPreviousStatus(currentStatus);

            // Generate new events if time has progressed
            if (currentElapsed > previousElapsed) {
              await generatePlayByPlayEvents(currentMatch, true);
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
        
        // Check for goal areas and generate events
        const isNearGoal = (newX <= 10 || newX >= 90) && (newY >= 35 && newY <= 65);
        const isInPenaltyArea = (newX <= 20 || newX >= 80) && (newY >= 25 && newY <= 75);
        
        // Generate events based on ball position
        if (isNearGoal && Math.random() < 0.02) { // 2% chance near goal
          const eventType = Math.random() < 0.3 ? 'goal' : Math.random() < 0.6 ? 'shot' : 'save';
          const team = newX <= 50 ? 'away' : 'home'; // Team attacking goal
          
          const newEvent: PlayByPlayEvent = {
            id: `live_event_${Date.now()}`,
            minute: elapsed,
            team,
            type: eventType as any,
            player: 'Player',
            description: eventType === 'goal' ? 'GOAL!' : eventType === 'shot' ? 'Shot saved' : 'Great save',
            timestamp: Date.now(),
            isRecent: true,
            x: newX,
            y: newY
          };
          
          setPlayByPlayEvents(prev => [newEvent, ...prev.slice(0, 6)]);
          setCurrentEvent(newEvent);
        } else if (isInPenaltyArea && Math.random() < 0.01) { // 1% chance in penalty area
          const eventType = Math.random() < 0.5 ? 'foul' : 'corner';
          const team = Math.random() > 0.5 ? 'home' : 'away';
          
          const newEvent: PlayByPlayEvent = {
            id: `live_event_${Date.now()}`,
            minute: elapsed,
            team,
            type: eventType as any,
            player: 'Player',
            description: eventType === 'foul' ? 'Foul in penalty area' : 'Corner kick',
            timestamp: Date.now(),
            isRecent: true,
            x: newX,
            y: newY
          };
          
          setPlayByPlayEvents(prev => [newEvent, ...prev.slice(0, 6)]);
        }
        
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
        
        // Update ball trail with enhanced tracking
        setBallTrail(prev => {
          const newTrail = [...prev, { x: newX, y: newY, timestamp: Date.now() }];
          // Keep last 12 trail points for smoother lines
          return newTrail.slice(-12);
        });
        
        return { x: newX, y: newY };
      });
    }, 100); // Increased update frequency for smoother movement

    return () => clearInterval(ballInterval);
  }, [isLive, ballDirection, elapsed]);

  // Move ball to event locations when events occur
  useEffect(() => {
    if (currentEvent && currentEvent.x && currentEvent.y) {
      setBallPosition({ x: currentEvent.x, y: currentEvent.y });
      // Clear trail when ball teleports to event
      setBallTrail([]);
    }
  }, [currentEvent]);

  const generatePlayByPlayEvents = async (matchData: any, isUpdate: boolean = false) => {
    try {
      // Fetch real match events from API
      const response = await fetch(`/api/fixtures/${matchData.fixture.id}/events`);
      let realEvents: any[] = [];
      
      if (response.ok) {
        realEvents = await response.json();
        console.log(`📊 [Live Action] Fetched ${realEvents.length} real events for match ${matchData.fixture.id}:`, realEvents);
      } else {
        console.log(`⚠️ [Live Action] No events API available for match ${matchData.fixture.id}, using fallback`);
      }

      const homeTeam = matchData.teams?.home;
      const awayTeam = matchData.teams?.away;
      const elapsed = matchData.fixture?.status?.elapsed || 0;

      const events: PlayByPlayEvent[] = [];

      // Process real events if available
      if (realEvents.length > 0) {
        const recentEvents = realEvents
          .filter(event => event.time?.elapsed <= elapsed)
          .slice(-6) // Get last 6 events
          .reverse(); // Most recent first

        recentEvents.forEach((event, index) => {
          const isHomeTeam = event.team?.id === homeTeam?.id;
          const team = isHomeTeam ? 'home' : 'away';
          
          // Map real event types to our display types
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
          } else if (event.detail?.toLowerCase().includes('offside')) {
            eventType = 'offside';
            description = 'Offside';
          } else if (event.detail?.toLowerCase().includes('foul')) {
            eventType = 'foul';
            description = 'Foul committed';
          } else if (event.detail?.toLowerCase().includes('shot')) {
            eventType = 'shot';
            description = event.detail;
          }

          // Calculate field position based on event type and team
          let x = 50, y = 50; // Default center
          
          if (eventType === 'goal') {
            x = isHomeTeam ? 95 : 5;
            y = 40 + Math.random() * 20; // Goal area
          } else if (eventType === 'corner') {
            x = isHomeTeam ? 95 : 5;
            y = Math.random() > 0.5 ? 15 : 85; // Corner positions
          } else if (eventType === 'shot') {
            x = isHomeTeam ? 75 + Math.random() * 20 : 5 + Math.random() * 20;
            y = 25 + Math.random() * 50;
          } else if (eventType === 'foul') {
            x = 30 + Math.random() * 40; // Midfield
            y = 20 + Math.random() * 60;
          } else {
            // General field position
            x = isHomeTeam ? 60 + Math.random() * 30 : 10 + Math.random() * 30;
            y = 20 + Math.random() * 60;
          }

          events.push({
            id: `real_event_${event.time?.elapsed}_${index}`,
            minute: event.time?.elapsed || elapsed,
            team,
            type: eventType as any,
            player: event.player?.name || event.assist?.name || 'Player',
            description,
            timestamp: Date.now() - (index * 10000), // Spread out timestamps
            isRecent: index === 0 && isUpdate,
            x,
            y
          });
        });
      }

      // If no real events or need to fill up, add some simulated events
      if (events.length < 3) {
        const simulatedCount = 3 - events.length;
        
        for (let i = 0; i < simulatedCount; i++) {
          const isHomeTeam = Math.random() > 0.5;
          const team = isHomeTeam ? 'home' : 'away';
          
          const eventTypes = ['shot', 'attempt', 'foul', 'corner'];
          const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          
          const descriptions = {
            shot: ['Shot saved', 'Shot blocked', 'Shot wide'],
            attempt: ['Attack', 'Close attempt'],
            foul: ['Foul committed', 'Free kick'],
            corner: ['Corner kick']
          };
          
          const description = descriptions[selectedType as keyof typeof descriptions][
            Math.floor(Math.random() * descriptions[selectedType as keyof typeof descriptions].length)
          ];

          // Position based on event type
          let x = 50, y = 50;
          if (selectedType === 'shot') {
            x = isHomeTeam ? 80 + Math.random() * 15 : 5 + Math.random() * 15;
          } else if (selectedType === 'corner') {
            x = isHomeTeam ? 95 : 5;
            y = Math.random() > 0.5 ? 15 : 85;
          } else {
            x = isHomeTeam ? 60 + Math.random() * 25 : 15 + Math.random() * 25;
          }
          y = 25 + Math.random() * 50;

          events.push({
            id: `sim_event_${Date.now()}_${i}`,
            minute: Math.max(1, elapsed - Math.floor(Math.random() * 10)),
            team,
            type: selectedType as any,
            player: 'Player',
            description,
            timestamp: Date.now() - ((events.length + i) * 8000),
            isRecent: false,
            x,
            y
          });
        }
      }

      // Sort by most recent first
      events.sort((a, b) => b.timestamp - a.timestamp);

      if (isUpdate) {
        // Add new events to the beginning, keep only recent ones
        setPlayByPlayEvents(prev => [...events.slice(0, 3), ...prev.slice(0, 4)]);
      } else {
        setPlayByPlayEvents(events);
      }

    } catch (error) {
      console.error('❌ [Live Action] Error fetching real events:', error);
      
      // Fallback to simulated events
      const events: PlayByPlayEvent[] = [{
        id: `fallback_${Date.now()}`,
        minute: matchData.fixture?.status?.elapsed || 45,
        team: Math.random() > 0.5 ? 'home' : 'away',
        type: 'attempt',
        player: 'Player',
        description: 'Match action',
        timestamp: Date.now(),
        isRecent: isUpdate,
        x: 50 + Math.random() * 30,
        y: 25 + Math.random() * 50
      }];
      
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

      {/* Football Field with Live Events */}
      <CardContent className="p-4 pb-2">
        <div className={`relative w-full h-48 ${
          halftimeFlash 
            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 border-orange-300/40' 
            : 'bg-gradient-to-r from-green-700 via-green-600 to-green-700 border-white/20'
        } rounded-lg overflow-hidden border-2 transition-all duration-1000 ease-in-out`}>
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

          {/* Ball trail with connecting lines */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 8 }}
          >
            {/* Draw connecting lines between trail points */}
            {ballTrail.length > 1 && ballTrail.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = ballTrail[index - 1];
              const opacity = Math.max(0.1, 0.6 - (index * 0.05));
              const strokeWidth = Math.max(1, 3 - (index * 0.2));
              
              return (
                <line
                  key={`trail-line-${index}`}
                  x1={`${prevPoint.x}%`}
                  y1={`${prevPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
                  }}
                />
              );
            })}
            
            {/* Draw movement prediction line */}
            {ballTrail.length > 0 && (
              <line
                x1={`${ballPosition.x}%`}
                y1={`${ballPosition.y}%`}
                x2={`${Math.min(95, Math.max(5, ballPosition.x + ballDirection.dx * 8))}%`}
                y2={`${Math.min(85, Math.max(15, ballPosition.y + ballDirection.dy * 8))}%`}
                stroke="rgba(255, 255, 0, 0.6)"
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.7"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Ball trail points */}
          {ballTrail.map((point, index) => (
            <div
              key={`trail-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-200"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: `${Math.max(2, 6 - index * 0.3)}px`,
                height: `${Math.max(2, 6 - index * 0.3)}px`,
                opacity: Math.max(0.1, 0.8 - (index * 0.08)),
                zIndex: 10 + index,
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)'
              }}
            />
          ))}

          {/* Live moving ball with enhanced effects */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
              zIndex: 20
            }}
          >
            {/* Outer glow ring */}
            <div className="absolute w-6 h-6 rounded-full bg-white opacity-20 animate-ping" 
                 style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}></div>
            
            {/* Middle glow */}
            <div className="absolute w-4 h-4 rounded-full bg-white opacity-40" 
                 style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}></div>
            
            {/* Ball core */}
            <div 
              className="relative w-3 h-3 bg-white rounded-full shadow-lg"
              style={{
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(255, 255, 255, 0.5), 0 0 24px rgba(255, 255, 255, 0.3)'
              }}
            >
              {/* Ball pattern */}
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-white via-gray-100 to-gray-200"></div>
              {/* Ball highlight */}
              <div className="absolute top-0 left-0 w-1 h-1 bg-white rounded-full opacity-80"></div>
            </div>
          </div>

          {/* Enhanced movement direction indicator */}
          {isLive && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${ballPosition.x}%`,
                top: `${ballPosition.y}%`,
                zIndex: 19
              }}
            >
              {/* Direction arrow */}
              <div
                className="absolute"
                style={{
                  width: '24px',
                  height: '3px',
                  background: 'linear-gradient(90deg, rgba(255, 255, 100, 0.8) 0%, rgba(255, 255, 100, 0) 100%)',
                  transformOrigin: 'left center',
                  transform: `rotate(${Math.atan2(ballDirection.dy, ballDirection.dx) * 180 / Math.PI}deg)`,
                  borderRadius: '2px'
                }}
              >
                {/* Arrow head */}
                <div 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid rgba(255, 255, 100, 0.8)',
                    borderTop: '2px solid transparent',
                    borderBottom: '2px solid transparent'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Current Event Display */}
        {(currentEvent || halftimeFlash) && (
          <div className={`mt-4 ${
            halftimeFlash 
              ? 'bg-orange-500/30 border border-orange-400/50' 
              : 'bg-black/20'
          } rounded-lg p-3 backdrop-blur-sm transition-all duration-500`}>
            <div className="flex items-center justify-between">
              {halftimeFlash ? (
                <div className="flex items-center gap-3 w-full justify-center">
                  <div className="text-2xl animate-bounce">⏸️</div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white animate-pulse">
                      HALFTIME BREAK
                    </div>
                    <div className="text-sm text-white/80">
                      First half has ended
                    </div>
                  </div>
                </div>
              ) : currentEvent ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Score Display */}
        <div className="mt-3 flex items-center justify-center">
          <div className={`${
            halftimeFlash 
              ? 'bg-orange-500/40 border border-orange-400/60' 
              : 'bg-black/30'
          } rounded-full px-4 py-2 backdrop-blur-sm transition-all duration-500`}>
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
              <span className={`text-xs font-medium ${
                halftimeFlash 
                  ? 'text-orange-200 animate-pulse' 
                  : 'text-white/80'
              } transition-colors duration-500`}>
                {statusData === 'HT' ? 'HT' : `${elapsed}'`}
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
