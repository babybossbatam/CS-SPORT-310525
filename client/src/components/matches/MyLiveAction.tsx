import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MyHighlights from './MyHighlights';
import '../../styles/liveaction.css';

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
  type: 'goal' | 'substitution' | 'card' | 'corner' | 'freekick' | 'offside' | 'foul' | 'shot' | 'save' | 'attempt' | 'attack';
  player: string;
  description: string;
  timestamp: number;
  isRecent?: boolean;
  x?: number;
  y?: number;
}

interface AttackPattern {
  id: string;
  team: 'home' | 'away';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  intensity: 'low' | 'medium' | 'high' | 'dangerous';
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
  const [playByPlayEvents, setPlayByPlayEvents] = useState<PlayByPlayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PlayByPlayEvent | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [ballDirection, setBallDirection] = useState({ dx: 1, dy: 0.5 });
  const [ballPossession, setBallPossession] = useState<'home' | 'away' | null>('home');
  const [attackPatterns, setAttackPatterns] = useState<AttackPattern[]>([]);
  const [currentAttack, setCurrentAttack] = useState<AttackPattern | null>(null);
  const [cornerKicks, setCornerKicks] = useState({ home: 0, away: 0 });

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

  // Enhanced ball movement with attack patterns
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballDirection.dx * 1.2;
        let newY = prev.y + ballDirection.dy * 1.2;

        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;

        // Determine ball possession and attack intensity
        if (newX < 50) {
          setBallPossession('home');
          // Generate attack pattern for home team
          if (Math.random() > 0.85) {
            generateAttackPattern('home', newX, newY);
          }
        } else {
          setBallPossession('away');
          // Generate attack pattern for away team
          if (Math.random() > 0.85) {
            generateAttackPattern('away', newX, newY);
          }
        }

        // Enhanced boundary physics
        if (newX <= 8 || newX >= 92) {
          newDx = -newDx + (Math.random() - 0.5) * 0.3;
          newX = Math.max(8, Math.min(92, newX));
        }

        if (newY <= 20 || newY >= 80) {
          newDy = -newDy + (Math.random() - 0.5) * 0.3;
          newY = Math.max(20, Math.min(80, newY));
        }

        // Natural variation
        newDx += (Math.random() - 0.5) * 0.08;
        newDy += (Math.random() - 0.5) * 0.08;

        // Speed control
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 2) {
          newDx = (newDx / speed) * 2;
          newDy = (newDy / speed) * 2;
        }

        setBallDirection({ dx: newDx, dy: newDy });

        return { x: newX, y: newY };
      });
    }, 120);

    return () => clearInterval(ballInterval);
  }, [isLive]);

  // Generate attack patterns
  const generateAttackPattern = (team: 'home' | 'away', startX: number, startY: number) => {
    const intensity = Math.random() > 0.7 ? 'dangerous' : Math.random() > 0.4 ? 'high' : 'medium';

    let endX, endY;
    if (team === 'home') {
      endX = startX + 15 + Math.random() * 20;
      endY = startY + (Math.random() - 0.5) * 15;
    } else {
      endX = startX - 15 - Math.random() * 20;
      endY = startY + (Math.random() - 0.5) * 15;
    }

    const newPattern: AttackPattern = {
      id: `attack_${Date.now()}_${Math.random()}`,
      team,
      startX,
      startY,
      endX: Math.max(10, Math.min(90, endX)),
      endY: Math.max(25, Math.min(75, endY)),
      intensity,
      timestamp: Date.now()
    };

    setAttackPatterns(prev => [newPattern, ...prev.slice(0, 2)]);
    setCurrentAttack(newPattern);

    // Create corresponding event
    if (intensity === 'dangerous') {
      const attackEvent: PlayByPlayEvent = {
        id: `attack_event_${Date.now()}`,
        minute: elapsed,
        team,
        type: 'attack',
        player: 'Team',
        description: 'Dangerous Attack',
        timestamp: Date.now(),
        isRecent: true,
        x: newPattern.endX,
        y: newPattern.endY
      };

      setPlayByPlayEvents(prev => [attackEvent, ...prev.slice(0, 4)]);
    }

    // Clear attack pattern after animation
    setTimeout(() => {
      setAttackPatterns(prev => prev.filter(p => p.id !== newPattern.id));
      if (currentAttack?.id === newPattern.id) {
        setCurrentAttack(null);
      }
    }, 3000);
  };

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

        // Only count corner kicks during initial load, not updates
        if (!isUpdate) {
          const allCornerEvents = realEvents.filter(event => 
            event.detail?.toLowerCase().includes('corner') && 
            event.time?.elapsed <= elapsed
          );

          const homeCorners = allCornerEvents.filter(event => event.team?.id === homeTeam?.id).length;
          const awayCorners = allCornerEvents.filter(event => event.team?.id === awayTeam?.id).length;

          setCornerKicks({ home: homeCorners, away: awayCorners });
        }

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

          // Only increment corner kicks on updates for new corner events
          if (isUpdate && eventType === 'corner' && index === 0) {
            setCornerKicks(prev => ({
              ...prev,
              [team]: prev[team] + 1
            }));
          }
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
      return homeTeam?.name || 'HOME';
    }
    return awayTeam?.name || 'AWAY';
  };

  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-green-700 rounded-lg overflow-hidden">
          <div className="bg-black/20 px-3 py-2 flex items-center justify-between">
            <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs px-2 py-1">
              Live Action
            </Badge>
            <div className="text-white text-xs flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
              Loading...
            </div>
          </div>
          <div className="h-32 flex items-center justify-center text-white text-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-2"></div>
              <p>Fetching live action...</p>
              <p className="text-xs opacity-70 mt-1">Please wait</p>
            </div>
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
      <div className={`w-full ${className}`}>
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
      <div className={`w-full ${className}`}>
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
    <div className={`w-full ${className} live-action-container`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
        {/* Header - 365scores style */}
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 text-xs font-medium uppercase tracking-wide">Live Action</span>
          </div>
          <div className="text-gray-600 text-xs font-medium">
            {elapsed}'
          </div>
        </div>

        {/* 365scores style Football Field */}
        <div className="relative h-64 bg-gradient-to-br from-green-600 via-green-500 to-green-600 overflow-hidden">

          {/* Professional grass pattern - more realistic stripes */}
          <div className="absolute inset-0">
            {/* Grass stripes - alternating lighter/darker with animation */}
            <div className="absolute inset-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full grass-stripe transition-opacity duration-300"
                  style={{
                    width: '6.25%',
                    left: `${i * 6.25}%`,
                    background: i % 2 === 0 
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
                      : 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.08) 100%)'
                  }}
                />
              ))}
            </div>

            {/* Field markings - 365scores precision */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                {/* Field line glow effect */}
                <filter id="fieldGlow">
                  <feGaussianBlur stdDeviation="0.2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Corner arc pattern */}
                <pattern id="cornerPattern" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.1" fill="rgba(255,255,255,0.3)"/>
                </pattern>
              </defs>

              {/* Outer boundary - thicker professional lines */}
              <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>

              {/* Center line */}
              <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>

              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              <circle cx="50" cy="50" r="0.6" fill="rgba(255,255,255,0.95)"/>

              {/* Goal areas - 6-yard box */}
              <rect x="5" y="38" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              <rect x="87" y="38" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>

              {/* Penalty areas - 18-yard box */}
              <rect x="5" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              <rect x="77" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" filter="url(#fieldGlow)"/>

              {/* Penalty spots */}
              <circle cx="17" cy="50" r="0.5" fill="rgba(255,255,255,0.95)"/>
              <circle cx="83" cy="50" r="0.5" fill="rgba(255,255,255,0.95)"/>

              {/* Penalty arcs */}
              <path d="M 26 50 A 9 9 0 0 1 26 50" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" 
                    transform="rotate(-45 17 50)" filter="url(#fieldGlow)"/>
              <path d="M 74 50 A 9 9 0 0 0 74 50" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" 
                    transform="rotate(45 83 50)" filter="url(#fieldGlow)"/>

              {/* Corner arcs */}
              <path d="M 7 15 A 2 2 0 0 1 5 17" stroke="rgba(255,255,255,0.9)" strokeWidth="0.3" fill="none" filter="url(#fieldGlow)"/>
              <path d="M 93 15 A 2 2 0 0 0 95 17" stroke="rgba(255,255,255,0.9)" strokeWidth="0.3" fill="none" filter="url(#fieldGlow)"/>
              <path d="M 7 85 A 2 2 0 0 0 5 83" stroke="rgba(255,255,255,0.9)" strokeWidth="0.3" fill="none" filter="url(#fieldGlow)"/>
              <path d="M 93 85 A 2 2 0 0 1 95 83" stroke="rgba(255,255,255,0.9)" strokeWidth="0.3" fill="none" filter="url(#fieldGlow)"/>

              {/* Goal posts */}
              <rect x="4" y="45" width="1" height="10" fill="rgba(255,255,255,0.95)"/>
              <rect x="95" y="45" width="1" height="10" fill="rgba(255,255,255,0.95)"/>
            </svg>
          </div>

          {/* Attack Patterns */}
          {attackPatterns.map((pattern) => (
            <div key={pattern.id} className="absolute inset-0 pointer-events-none z-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`attackGradient-${pattern.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={pattern.team === 'home' ? '#3b82f6' : '#ef4444'} stopOpacity="0.8"/>
                    <stop offset="50%" stopColor={pattern.team === 'home' ? '#1d4ed8' : '#dc2626'} stopOpacity="0.6"/>
                    <stop offset="100%" stopColor={pattern.team === 'home' ? '#1e40af' : '#b91c1c'} stopOpacity="0.3"/>
                  </linearGradient>
                  <filter id={`attackShadow-${pattern.id}`}>
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)"/>
                  </filter>
                </defs>

                {/* Attack cone/area */}
                <path
                  d={`M ${pattern.startX} ${pattern.startY} 
                      L ${pattern.endX - 5} ${pattern.endY - 8} 
                      L ${pattern.endX + 5} ${pattern.endY + 8} 
                      Z`}
                  fill={`url(#attackGradient-${pattern.id})`}
                  filter={`url(#attackShadow-${pattern.id})`}
                  className="attack-animation"
                  opacity={pattern.intensity === 'dangerous' ? '0.9' : '0.6'}
                />

                {/* Attack line */}
                <line
                  x1={pattern.startX}
                  y1={pattern.startY}
                  x2={pattern.endX}
                  y2={pattern.endY}
                  stroke={pattern.team === 'home' ? '#3b82f6' : '#ef4444'}
                  strokeWidth={pattern.intensity === 'dangerous' ? '1.2' : '0.8'}
                  strokeDasharray="2,1"
                  className="attack-line-animation"
                  filter={`url(#attackShadow-${pattern.id})`}
                />

                {/* Attack direction arrow */}
                <polygon
                  points={`${pattern.endX-2},${pattern.endY-2} ${pattern.endX+2},${pattern.endY} ${pattern.endX-2},${pattern.endY+2}`}
                  fill={pattern.team === 'home' ? '#1d4ed8' : '#dc2626'}
                  className="attack-arrow-animation"
                />
              </svg>
            </div>
          ))}

          {/* Corner Kick Visualization */}
          {currentEvent && currentEvent.type === 'corner' && (
            <div className="absolute inset-0 pointer-events-none z-25">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <filter id="cornerGlow">
                    <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Corner kick arc - dotted line from corner to penalty area */}
                <path
                  d={`M ${currentEvent.x} ${currentEvent.y} Q ${currentEvent.x! + (currentEvent.team === 'home' ? 15 : -15)} ${currentEvent.y! - 10} ${currentEvent.x! + (currentEvent.team === 'home' ? 20 : -20)} ${50}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="0.8"
                  strokeDasharray="2,1.5"
                  filter="url(#cornerGlow)"
                  className="corner-arc-animation"
                />

                {/* Corner flag indicator */}
                <circle
                  cx={currentEvent.x}
                  cy={currentEvent.y}
                  r="1.2"
                  fill="rgba(255,255,255,0.95)"
                  className="corner-flag-animation"
                />

                {/* Corner area highlight */}
                <rect
                  x={currentEvent.team === 'home' ? 87 : 5}
                  y={currentEvent.y! > 50 ? 70 : 15}
                  width="8"
                  height="15"
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="0.3"
                  className="corner-area-highlight"
                />
              </svg>
            </div>
          )}

          {/* 365scores style Ball with realistic movement */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Ball shadow */}
              <div className="absolute w-4 h-2 bg-black/20 rounded-full blur-sm" 
                   style={{ left: '-8px', top: '8px' }}></div>
              
              {/* Main ball */}
              <div className="w-4 h-4 bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-full shadow-lg border border-gray-300 relative">
                {/* Ball pattern */}
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute w-1 h-1 bg-gray-400 rounded-full top-1 left-1"></div>
                  <div className="absolute w-0.5 h-0.5 bg-gray-400 rounded-full bottom-1 right-1"></div>
                </div>
                
                {/* Ball movement trail */}
                {ballPossession && (
                  <div className={`absolute inset-0 rounded-full animate-pulse ${
                    ballPossession === 'home' ? 'ring-2 ring-blue-400' : 'ring-2 ring-red-400'
                  }`}></div>
                )}
              </div>
            </div>
          </div>

          {/* 365scores style event overlays */}
          {currentEvent && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              {/* Main event display - center overlay like 365scores */}
              <div className="bg-white/98 backdrop-blur-md rounded-lg px-6 py-3 text-center shadow-2xl border border-gray-200 max-w-sm event-overlay">
                <div className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-1">
                  {currentEvent.type === 'goal' ? 'GOAL!' : 
                   currentEvent.type === 'substitution' ? 'SUBSTITUTION' :
                   currentEvent.type === 'card' ? 'CARD' :
                   currentEvent.type === 'corner' ? 'CORNER KICK' :
                   currentEvent.type === 'shot' ? 'SHOT' :
                   'MATCH EVENT'}
                </div>
                <div className="text-gray-900 text-sm font-bold mb-2">
                  {currentEvent.description}
                </div>
                {currentEvent.player !== 'Team' && (
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={currentEvent.team === 'home' ? homeTeamData?.logo : awayTeamData?.logo}
                      alt={currentEvent.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/fallback-logo.svg';
                      }}
                    />
                    <div className="text-gray-700 text-xs font-medium">
                      {currentEvent.player}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Player position indicators */}
          {currentEvent && currentEvent.type === 'substitution' && (
            <div>
              {/* Substitution OUT indicator */}
              <div 
                className="absolute z-40 pointer-events-none"
                style={{
                  left: `${currentEvent.x || 50}%`,
                  top: `${(currentEvent.y || 50) - 8}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg border-2 border-white">
                  OUT
                </div>
                <div className="bg-white rounded-md px-2 py-1 text-xs font-medium shadow-md mt-1 border border-gray-200">
                  <div className="text-gray-600 text-xs">33 | MIDFIELDER</div>
                  <div className="text-gray-800 font-medium">Evangelista, Lucas</div>
                </div>
              </div>

              {/* Substitution IN indicator */}
              <div 
                className="absolute z-40 pointer-events-none"
                style={{
                  right: `${100 - (currentEvent.x || 50)}%`,
                  bottom: `${100 - (currentEvent.y || 50)}%`,
                  transform: 'translate(50%, 50%)'
                }}
              >
                <div className="bg-green-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg border-2 border-white">
                  IN
                </div>
                <div className="bg-white rounded-md px-2 py-1 text-xs font-medium shadow-md mt-1 border border-gray-200">
                  <div className="text-blue-500 font-medium">Roque, Vitor</div>
                  <div className="text-gray-600 text-xs">FORWARD | 9</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Corners Section - 365scores style */}
        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
          <div className="text-center text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
            Corners
          </div>

          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-2">
              <img
                src={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                alt={homeTeamData?.name || 'Home Team'}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/assets/fallback-logo.svg';
                }}
              />
              <div className="text-lg font-bold text-gray-800">
                {cornerKicks.home}
              </div>
            </div>

            {/* Simple Progress Bar */}
            <div className="flex-1 mx-3">
              <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-blue-500 transition-all duration-500"
                    style={{ 
                      width: `${(cornerKicks.home / Math.max(cornerKicks.home + cornerKicks.away, 1)) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="bg-red-500 transition-all duration-500"
                    style={{ 
                      width: `${(cornerKicks.away / Math.max(cornerKicks.home + cornerKicks.away, 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-gray-800">
                {cornerKicks.away}
              </div>
              <img
                src={awayTeamData?.logo || '/assets/fallback-logo.svg'}
                alt={awayTeamData?.name || 'Away Team'}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/assets/fallback-logo.svg';
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyLiveAction;