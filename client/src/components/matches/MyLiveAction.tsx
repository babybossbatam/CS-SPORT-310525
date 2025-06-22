
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

          // Count corner kicks from real events
          if (eventType === 'corner') {
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
        {/* Header */}
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

        {/* Enhanced Football Field */}
        <div className="relative h-48 sm:h-56 field-overlay overflow-hidden bg-gradient-to-br from-green-600 to-green-800">
          
          {/* Enhanced Field Pattern */}
          <div className="absolute inset-0">
            {/* Grass texture with vertical stripes */}
            <div className="absolute inset-0 opacity-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full"
                  style={{
                    width: '8.33%',
                    left: `${i * 8.33}%`,
                    background: i % 2 === 0 
                      ? 'linear-gradient(180deg, rgba(34, 197, 94, 0.4), rgba(21, 128, 61, 0.2))'
                      : 'linear-gradient(180deg, rgba(21, 128, 61, 0.3), rgba(34, 197, 94, 0.1))'
                  }}
                />
              ))}
            </div>

            {/* Field markings - Enhanced 365scores style */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="fieldGlow">
                  <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Outer boundary */}
              <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              
              {/* Center line */}
              <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              
              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.9)"/>
              
              {/* Goal areas */}
              <rect x="5" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              <rect x="87" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              
              {/* Penalty areas */}
              <rect x="5" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              <rect x="77" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#fieldGlow)"/>
              
              {/* Penalty spots */}
              <circle cx="17" cy="50" r="0.6" fill="rgba(255,255,255,0.9)"/>
              <circle cx="83" cy="50" r="0.6" fill="rgba(255,255,255,0.9)"/>
              
              {/* Corner arcs */}
              <path d="M 5 15 Q 8 15 8 18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4"/>
              <path d="M 5 85 Q 8 85 8 82" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4"/>
              <path d="M 95 15 Q 92 15 92 18" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4"/>
              <path d="M 95 85 Q 92 85 92 82" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4"/>
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

          {/* Enhanced Ball */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Ball trail effect */}
              <div className="absolute inset-0 w-5 h-5 bg-white/30 rounded-full blur-md scale-125 ball-trail"></div>
              
              {/* Ball shadow */}
              <div className="absolute top-1 left-1 w-4 h-4 bg-black/20 rounded-full blur-sm"></div>
              
              {/* Enhanced Ball */}
              <div 
                className="relative w-4 h-4 rounded-full shadow-lg ball-flash"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #ffffff, #f8f8f8, #e8e8e8, #d0d0d0)',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {/* Ball pattern */}
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute top-1 left-1 w-1 h-1 bg-black/40 rounded-full"></div>
                  <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-black/30 rounded-full"></div>
                  <div className="absolute top-1.5 right-1 w-0.5 h-1.5 bg-black/20 rounded-full transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Team possession overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            {currentAttack && (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 text-center possession-fade-in border border-white/20 shadow-lg">
                <div className="text-white text-xs font-medium mb-1 opacity-80 tracking-wide">
                  {currentAttack.intensity === 'dangerous' ? 'Dangerous Attack' : 'Attack'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {currentAttack.team === 'home' && homeTeamData?.logo && (
                    <div className="relative">
                      <img 
                        src={homeTeamData.logo} 
                        alt={homeTeamData.name}
                        className="w-7 h-7 object-contain rounded-full"
                      />
                      <div className="absolute inset-0 rounded-full ring-2 ring-blue-400"></div>
                    </div>
                  )}
                  {currentAttack.team === 'away' && awayTeamData?.logo && (
                    <div className="relative">
                      <img 
                        src={awayTeamData.logo} 
                        alt={awayTeamData.name}
                        className="w-7 h-7 object-contain rounded-full"
                      />
                      <div className="absolute inset-0 rounded-full ring-2 ring-red-400"></div>
                    </div>
                  )}
                  <div className="text-white text-sm font-semibold tracking-wide opacity-90">
                    {currentAttack.team === 'home' 
                      ? getTeamDisplayName('home') 
                      : getTeamDisplayName('away')
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event indicator */}
          {currentEvent && currentEvent.type !== 'attack' && (
            <div className="absolute top-3 left-3 z-50">
              <div className="bg-yellow-500/90 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs text-black font-semibold shadow-lg animate-pulse">
                {currentEvent.description}
              </div>
            </div>
          )}

        </div>

        {/* Corner Kicks Stats Bar - 365scores style */}
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {homeTeamData?.logo && (
                <img src={homeTeamData.logo} alt="" className="w-4 h-4 object-contain rounded-full" />
              )}
              <span className="text-white font-semibold">{cornerKicks.home}</span>
            </div>
            
            <div className="flex-1 mx-4">
              <div className="text-center text-white/70 text-xs mb-1 font-medium">CORNER KICKS</div>
              <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                {/* Home team corner kicks bar */}
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(50, (cornerKicks.home / Math.max(1, cornerKicks.home + cornerKicks.away)) * 50)}%` 
                  }}
                ></div>
                {/* Away team corner kicks bar */}
                <div 
                  className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(50, (cornerKicks.away / Math.max(1, cornerKicks.home + cornerKicks.away)) * 50)}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{cornerKicks.away}</span>
              {awayTeamData?.logo && (
                <img src={awayTeamData.logo} alt="" className="w-4 h-4 object-contain rounded-full" />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyLiveAction;
