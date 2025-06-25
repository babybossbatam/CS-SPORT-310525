import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MyHighlights from './MyHighlights';
import '../../styles/liveaction.css';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyCircularFlag from '@/components/common/MyCircularFlag';
import { isNationalTeam } from '@/lib/teamLogoSources';

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
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      setLiveData(null);
      setPlayByPlayEvents([]);
      setCurrentEvent(null);
      setAttackPatterns([]);
      setCurrentAttack(null);
    };
  }, [matchId]);

  // Ball movement with realistic field positioning
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballDirection.dx * 0.8;
        let newY = prev.y + ballDirection.dy * 0.8;

        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;

        const minX = 10;
        const maxX = 90;
        const minY = 25;
        const maxY = 75;

        if (newX < 35) {
          setBallPossession('home');
          if (Math.random() > 0.96) {
            generateAttackPattern('home', newX, newY);
          }
        } else if (newX > 65) {
          setBallPossession('away');
          if (Math.random() > 0.96) {
            generateAttackPattern('away', newX, newY);
          }
        } else {
          setBallPossession(null);
        }

        if (newX <= minX || newX >= maxX) {
          newDx = -newDx * 0.7 + (Math.random() - 0.5) * 0.3;
          newX = Math.max(minX, Math.min(maxX, newX));
        }

        if (newY <= minY || newY >= maxY) {
          newDy = -newDy * 0.7 + (Math.random() - 0.5) * 0.3;
          newY = Math.max(minY, Math.min(maxY, newY));
        }

        newDx += (Math.random() - 0.5) * 0.05;
        newDy += (Math.random() - 0.5) * 0.05;

        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 1.0) {
          newDx = (newDx / speed) * 1.0;
          newDy = (newDy / speed) * 1.0;
        }
        if (speed < 0.3) {
          newDx = (newDx / speed) * 0.3;
          newDy = (newDy / speed) * 0.3;
        }

        setBallDirection({ dx: newDx, dy: newDy });

        return { x: newX, y: newY };
      });
    }, 300);

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
      const eventAge = Date.now() - latestEvent.timestamp;

      if (eventAge < 120000) {
        setCurrentEvent(latestEvent);

        const hideEventTimeout = setTimeout(() => {
          setCurrentEvent(null);
        }, 6000);

        const cleanupTimeout = () => clearTimeout(hideEventTimeout);

        if (playByPlayEvents.length > 1) {
          const recentEvents = playByPlayEvents.slice(0, 3).filter(event => 
            Date.now() - event.timestamp < 120000
          );

          if (recentEvents.length > 1) {
            const eventCycleInterval = setInterval(() => {
              setCurrentEvent(null);

              setTimeout(() => {
                const currentIndex = recentEvents.findIndex(e => e.id === currentEvent?.id);
                const nextIndex = (currentIndex + 1) % recentEvents.length;
                setCurrentEvent(recentEvents[nextIndex]);

                setTimeout(() => {
                  setCurrentEvent(null);
                }, 5000);
              }, 1000);
            }, 8000);

            return () => {
              clearInterval(eventCycleInterval);
              cleanupTimeout();
            };
          }
        }

        return cleanupTimeout;
      } else {
        setCurrentEvent(null);
      }
    } else {
      setCurrentEvent(null);
    }
  }, [playByPlayEvents.length, currentEvent?.id])

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
          .slice(-3)
          .reverse();

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
            const goalDetail = event.detail || '';
            if (goalDetail.toLowerCase().includes('normal goal')) {
              description = 'GOAL!';
            } else {
              description = goalDetail.includes('Goal') ? goalDetail : `${goalDetail} Goal`;
            }
          } else if (event.type === 'Card') {
            eventType = 'card';
            description = `${event.detail || 'Yellow'} Card`;
          } else if (event.type === 'subst') {
            eventType = 'substitution';
            description = 'Substitution';
          } else if (event.detail?.toLowerCase().includes('corner')) {
            eventType = 'corner';
            description = 'Corner Kick';
          } else if (event.detail?.toLowerCase().includes('shot')) {
            eventType = 'shot';
            description = event.detail;
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

  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-800 text-sm font-semibold">Live Action</span>
            </div>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-green-500 mx-auto mb-2"></div>
              <p>Loading live action...</p>
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
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Action</span>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            {matchId ? `No match data found` : 'No match selected'}
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Action</span>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
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
    <div className={`w-full ${className} modern-live-action`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
        {/* Modern Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-gray-800 text-sm font-semibold">Live Action</span>
            </div>
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              {elapsed}'
            </div>
          </div>
        </div>

        {/* Premium Football Field - Landscape */}
        <div className="relative h-80 bg-gradient-to-br from-green-600 via-green-500 to-green-600 overflow-hidden">

          {/* Grass pattern */}
          <div className="absolute inset-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-full transition-all duration-500"
                style={{
                  width: '8.33%',
                  left: `${i * 8.33}%`,
                  background: i % 2 === 0 
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.03)',
                }}
              />
            ))}
          </div>

          {/* Field markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.2" result="coloredBlur"/>
                <feColorMatrix values="1 1 1 0 0  1 1 1 0 0  1 1 1 0 0  0 0 0 1 0" result="whiteGlow"/>
                <feMerge> 
                  <feMergeNode in="whiteGlow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Outer boundary */}
            <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>

            {/* Center line */}
            <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>

            {/* Center circle */}
            <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>
            <circle cx="50" cy="50" r="0.6" fill="rgba(255,255,255,0.9)"/>

            {/* Goal areas */}
            <rect x="5" y="38" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>
            <rect x="87" y="38" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>

            {/* Penalty areas */}
            <rect x="5" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>
            <rect x="77" y="28" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" filter="url(#glow)"/>

            {/* Corner arcs */}
            <path d="M 7 15 A 2 2 0 0 1 5 17" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" fill="none" filter="url(#glow)"/>
            <path d="M 93 15 A 2 2 0 0 0 95 17" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" fill="none" filter="url(#glow)"/>
            <path d="M 7 85 A 2 2 0 0 0 5 83" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" fill="none" filter="url(#glow)"/>
            <path d="M 93 85 A 2 2 0 0 1 95 83" stroke="rgba(255,255,255,0.8)" strokeWidth="0.3" fill="none" filter="url(#glow)"/>
          </svg>

          {/* Attack patterns with simple white lines */}
          {attackPatterns.map((pattern) => (
            <div key={pattern.id} className="absolute inset-0 pointer-events-none z-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line
                  x1={pattern.startX}
                  y1={pattern.startY}
                  x2={pattern.endX}
                  y2={pattern.endY}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="0.8"
                  strokeDasharray="2,1"
                  className="animate-pulse"
                />
                <polygon
                  points={`${pattern.endX-1.5},${pattern.endY-1.5} ${pattern.endX+1.5},${pattern.endY} ${pattern.endX-1.5},${pattern.endY+1.5}`}
                  fill="rgba(255,255,255,0.9)"
                />
              </svg>
            </div>
          ))}

          {/* Modern White Ball with pulse animation */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Ball shadow */}
              <div className="absolute w-4 h-2 bg-black/20 rounded-full blur-sm transform" 
                   style={{ left: '-8px', top: '8px' }}></div>

              {/* White ball with pulse */}
              <div className="w-3 h-3 bg-white rounded-full shadow-lg relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent"></div>

                {/* Possession indicator ring */}
                {ballPossession && (
                  <div className="absolute -inset-1">
                    <div className={`w-5 h-5 rounded-full animate-ping opacity-40 ${
                      ballPossession === 'home' 
                        ? 'bg-blue-400' 
                        : 'bg-red-400'
                    }`}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event overlay */}
          {currentEvent && (
            <div className="absolute top-4 right-4 z-50 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200 max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    {currentEvent.minute}'
                  </div>
                  <span className="text-sm">
                    {currentEvent.type === 'goal' ? '⚽' : 
                     currentEvent.type === 'corner' ? '🚩' :
                     currentEvent.type === 'card' ? '🟨' :
                     currentEvent.type === 'attack' ? '⚽' : '⚽'}
                  </span>
                </div>
                <div className="text-gray-800 text-sm font-medium">
                  {currentEvent.description}
                </div>
                <div className="text-gray-600 text-xs">
                  {currentEvent.player !== 'Team' ? currentEvent.player : 
                   currentEvent.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                </div>
              </div>
            </div>
          )}

          {/* Team logos on field */}
          <div className="absolute top-4 left-4 z-40">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="relative">
                {displayMatch.league?.country === "World" ||
                displayMatch.league?.country === "International" ? (
                  <MyWorldTeamLogo
                    teamName={homeTeamData?.name}
                    teamLogo={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                    alt={homeTeamData?.name || 'Home Team'}
                    size="24px"
                    leagueContext={{
                      name: displayMatch.league?.name || '',
                      country: displayMatch.league?.country || '',
                    }}
                  />
                ) : isNationalTeam(homeTeamData, displayMatch.league) ? (
                  <MyCircularFlag
                    teamName={homeTeamData?.name}
                    fallbackUrl={homeTeamData?.logo}
                    alt={homeTeamData?.name || 'Home Team'}
                    size="24px"
                  />
                ) : (
                  <img
                    src={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                    alt={homeTeamData?.name || 'Home Team'}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/fallback-logo.svg';
                    }}
                  />
                )}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-white text-sm font-medium">
                {homeTeamData?.name?.substring(0, 8)}
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-40" style={{ right: currentEvent ? '200px' : '16px' }}>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm font-medium">
                {awayTeamData?.name?.substring(0, 8)}
              </span>
              <div className="relative">
                <img
                  src={awayTeamData?.logo || '/assets/fallback-logo.svg'}
                  alt={awayTeamData?.name || 'Away Team'}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/fallback-logo.svg';
                  }}
                />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLiveAction;