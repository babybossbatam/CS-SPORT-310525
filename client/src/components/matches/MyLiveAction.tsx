import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MyHighlights from './MyHighlights';
import '../../styles/liveaction.css';
import { MyWorldTeamLogo } from '@/components/common/MyWorldTeamLogo';
import MyCircularFlag from '@/components/common/MyCircularFlag';
import { isNationalTeam } from '@/utils/utils';

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
      // Clean up state to prevent DOM manipulation errors
      setLiveData(null);
      setPlayByPlayEvents([]);
      setCurrentEvent(null);
      setAttackPatterns([]);
      setCurrentAttack(null);
    };
  }, [matchId]);

  // More realistic ball movement with smoother patterns
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballDirection.dx * 0.8; // Slower, more realistic
        let newY = prev.y + ballDirection.dy * 0.8;

        let newDx = ballDirection.dx;
        let newDy = ballDirection.dy;

        // Determine ball possession more naturally
        if (newX < 45) {
          setBallPossession('home');
          // Less frequent attack patterns
          if (Math.random() > 0.95) {
            generateAttackPattern('home', newX, newY);
          }
        } else if (newX > 55) {
          setBallPossession('away');
          if (Math.random() > 0.95) {
            generateAttackPattern('away', newX, newY);
          }
        } else {
          setBallPossession(null); // Neutral zone
        }

        // Smoother boundary physics
        if (newX <= 10 || newX >= 90) {
          newDx = -newDx * 0.8 + (Math.random() - 0.5) * 0.2;
          newX = Math.max(10, Math.min(90, newX));
        }

        if (newY <= 25 || newY >= 75) {
          newDy = -newDy * 0.8 + (Math.random() - 0.5) * 0.2;
          newY = Math.max(25, Math.min(75, newY));
        }

        // Gentler variation
        newDx += (Math.random() - 0.5) * 0.04;
        newDy += (Math.random() - 0.5) * 0.04;

        // Conservative speed control
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 1.5) {
          newDx = (newDx / speed) * 1.5;
          newDy = (newDy / speed) * 1.5;
        }

        setBallDirection({ dx: newDx, dy: newDy });

        return { x: newX, y: newY };
      });
    }, 200); // Slower update rate

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

  // Auto-update current event display - show latest event and hold it longer
  useEffect(() => {
    if (playByPlayEvents.length > 0) {
      const latestEvent = playByPlayEvents[0];
      setCurrentEvent(latestEvent);

      // Only cycle if there are multiple recent events, and do it less frequently
      if (playByPlayEvents.length > 1) {
        const eventCycleInterval = setInterval(() => {
          const recentEvents = playByPlayEvents.slice(0, 2); // Only show 2 most recent
          if (recentEvents.length > 1) {
            const currentIndex = recentEvents.findIndex(e => e.id === currentEvent?.id);
            const nextIndex = (currentIndex + 1) % recentEvents.length;
            setCurrentEvent(recentEvents[nextIndex]);
          }
        }, 8000); // Longer interval - 8 seconds

        return () => {
          clearInterval(eventCycleInterval);
        };
      }
    }
  }, [playByPlayEvents.length])

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
            // Clean up goal description - remove redundant "Normal Goal" text
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
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accentPrimary rounded-full animate-pulse"></div>
              <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">Live Action</span>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-textSecondary border-t-transparent mx-auto mb-2"></div>
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
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">Live Action</span>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
            {matchId ? `No match data found` : 'No match selected'}
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-surfaceSecondary rounded-lg overflow-hidden shadow-sm border border-dividerPrimary">
          <div className="bg-surfacePrimary px-3 py-2 border-b border-dividerPrimary">
            <span className="text-textPrimary text-xs font-medium uppercase tracking-wide">Live Action</span>
          </div>
          <div className="h-48 flex items-center justify-center text-textSecondary text-sm bg-surfaceSecondary">
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
    <div className={`w-full ${className} live-action-container premium-pro-style`}>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 px-6 py-4 border-b border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold tracking-wider">LIVE ACTION</span>
                <span className="text-slate-400 text-xs font-medium">Real-time match visualization</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                {elapsed}'
              </div>
              <div className="w-2 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full opacity-60 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Premium Football Field */}
        <div className="relative h-96 bg-gradient-to-br from-emerald-800 via-green-600 to-emerald-800 overflow-hidden shadow-inner">

          {/* Premium ambient lighting overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-green-500/5 to-black/20"></div>
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent"></div>

          {/* Premium grass pattern with depth */}
          <div className="absolute inset-0">
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full grass-stripe transition-all duration-500 hover:opacity-80"
                  style={{
                    width: '5%',
                    left: `${i * 5}%`,
                    background: i % 2 === 0 
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.12) 100%)'
                      : 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%, rgba(0,0,0,0.12) 100%)',
                    boxShadow: i % 2 === 0 ? 'inset 0 0 20px rgba(255,255,255,0.02)' : 'inset 0 0 20px rgba(0,0,0,0.02)'
                  }}
                />
              ))}
            </div>

            {/* Stadium lighting effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5"></div>
            <div className="absolute top-0 left-1/4 w-1/2 h-1/4 bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl"></div>

            {/* Premium field markings with advanced lighting */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="premiumGlow">
                  <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                  <feColorMatrix values="1 1 1 0 0  1 1 1 0 0  1 1 1 0 0  0 0 0 1 0" result="whiteGlow"/>
                  <feMerge> 
                    <feMergeNode in="whiteGlow"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="shadowEffect">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.3)"/>
                </filter>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
                </linearGradient>
              </defs>

              {/* Outer boundary */}
              <rect x="5" y="15" width="90" height="70" fill="none" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>

              {/* Center line */}
              <line x1="50" y1="15" x2="50" y2="85" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>

              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>
              <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.95)" filter="url(#shadowEffect)"/>

              {/* Goal areas */}
              <rect x="5" y="38" width="8" height="24" fill="none" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>
              <rect x="87" y="38" width="8" height="24" fill="none" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>

              {/* Penalty areas */}
              <rect x="5" y="28" width="18" height="44" fill="none" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>
              <rect x="77" y="28" width="18" height="44" fill="none" stroke="url(#lineGradient)" strokeWidth="0.6" filter="url(#premiumGlow)"/>

              {/* Penalty spots */}
              <circle cx="17" cy="50" r="0.6" fill="rgba(255,255,255,0.95)" filter="url(#shadowEffect)"/>
              <circle cx="83" cy="50" r="0.6" fill="rgba(255,255,255,0.95)" filter="url(#shadowEffect)"/>

              {/* Corner arcs */}
              <path d="M 7 15 A 2 2 0 0 1 5 17" stroke="url(#lineGradient)" strokeWidth="0.5" fill="none" filter="url(#premiumGlow)"/>
              <path d="M 93 15 A 2 2 0 0 0 95 17" stroke="url(#lineGradient)" strokeWidth="0.5" fill="none" filter="url(#premiumGlow)"/>
              <path d="M 7 85 A 2 2 0 0 0 5 83" stroke="url(#lineGradient)" strokeWidth="0.5" fill="none" filter="url(#premiumGlow)"/>
              <path d="M 93 85 A 2 2 0 0 1 95 83" stroke="url(#lineGradient)" strokeWidth="0.5" fill="none" filter="url(#premiumGlow)"/>

              {/* Premium Goal posts */}
              <rect x="4" y="45" width="1.2" height="10" fill="rgba(255,255,255,0.95)" filter="url(#shadowEffect)"/>
              <rect x="94.8" y="45" width="1.2" height="10" fill="rgba(255,255,255,0.95)" filter="url(#shadowEffect)"/>
            </svg>
          </div>

          {/* Attack Patterns */}
          {attackPatterns.map((pattern) => (
            <div key={pattern.id} className="absolute inset-0 pointer-events-none z-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`attackGradient-${pattern.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={pattern.team === 'home' ? '#2194ff' : '#ff495c'} stopOpacity="0.8"/>
                    <stop offset="50%" stopColor={pattern.team === 'home' ? '#1d4ed8' : '#dc2626'} stopOpacity="0.6"/>
                    <stop offset="100%" stopColor={pattern.team === 'home' ? '#1e40af' : '#b91c1c'} stopOpacity="0.3"/>
                  </linearGradient>
                </defs>

                <path
                  d={`M ${pattern.startX} ${pattern.startY} 
                      L ${pattern.endX - 5} ${pattern.endY - 8} 
                      L ${pattern.endX + 5} ${pattern.endY + 8} 
                      Z`}
                  fill={`url(#attackGradient-${pattern.id})`}
                  className="attack-animation"
                  opacity={pattern.intensity === 'dangerous' ? '0.9' : '0.6'}
                />

                <line
                  x1={pattern.startX}
                  y1={pattern.startY}
                  x2={pattern.endX}
                  y2={pattern.endY}
                  stroke={pattern.team === 'home' ? '#2194ff' : '#ff495c'}
                  strokeWidth={pattern.intensity === 'dangerous' ? '1.2' : '0.8'}
                  strokeDasharray="2,1"
                  className="attack-line-animation"
                />

                <polygon
                  points={`${pattern.endX-2},${pattern.endY-2} ${pattern.endX+2},${pattern.endY} ${pattern.endX-2},${pattern.endY+2}`}
                  fill={pattern.team === 'home' ? '#2194ff' : '#ff495c'}
                  className="attack-arrow-animation"
                />
              </svg>
            </div>
          ))}

          {/* Premium 3D Ball with enhanced physics */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Enhanced shadow */}
              <div className="absolute w-6 h-3 bg-black/30 rounded-full blur-md transform rotate-3" 
                   style={{ left: '-12px', top: '12px' }}></div>

              {/* Premium ball design */}
              <div className="w-5 h-5 bg-gradient-to-br from-white via-gray-50 to-gray-200 rounded-full shadow-2xl border border-gray-300 relative overflow-hidden">
                {/* Ball texture */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute w-1.5 h-1.5 bg-gray-500 rounded-full top-1 left-1 opacity-60"></div>
                  <div className="absolute w-1 h-1 bg-gray-400 rounded-full bottom-1 right-1 opacity-40"></div>
                  <div className="absolute w-0.5 h-0.5 bg-gray-600 rounded-full top-2 right-1.5 opacity-50"></div>
                </div>

                {/* Premium possession indicator */}
                {ballPossession && (
                  <div className="absolute -inset-1">
                    <div className={`w-7 h-7 rounded-full animate-pulse ${
                      ballPossession === 'home' 
                        ? 'ring-2 ring-blue-400 bg-blue-400/10' 
                        : 'ring-2 ring-red-400 bg-red-400/10'
                    }`}></div>
                    <div className={`absolute inset-0 w-7 h-7 rounded-full animate-ping opacity-20 ${
                      ballPossession === 'home' ? 'bg-blue-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Premium event overlay */}
          {currentEvent && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl px-8 py-6 text-center shadow-2xl border border-slate-600/50 max-w-sm event-overlay transform animate-in fade-in-0 zoom-in-95 duration-300">
                {/* Premium event type badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                  currentEvent.type === 'goal' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                  currentEvent.type === 'substitution' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' :
                  currentEvent.type === 'card' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' :
                  currentEvent.type === 'corner' ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white' :
                  currentEvent.type === 'shot' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' :
                  'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                }`}>
                  <span className="text-lg">
                    {currentEvent.type === 'goal' ? '⚽' : 
                     currentEvent.type === 'substitution' ? '🔄' :
                     currentEvent.type === 'card' ? '🟨' :
                     currentEvent.type === 'corner' ? '🚩' :
                     currentEvent.type === 'shot' ? '🎯' :
                     '⚽'}
                  </span>
                  <span className="uppercase tracking-wider">
                    {currentEvent.type === 'goal' ? 'GOAL!' : 
                     currentEvent.type === 'substitution' ? 'SUBSTITUTION' :
                     currentEvent.type === 'card' ? 'CARD' :
                     currentEvent.type === 'corner' ? 'CORNER' :
                     currentEvent.type === 'shot' ? 'SHOT' :
                     'LIVE'}
                  </span>
                </div>

                <div className="text-white text-lg font-bold mb-4">
                  {currentEvent.description}
                </div>

                <div className="flex items-center justify-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
                  {displayMatch.league?.country === "World" ||
                  displayMatch.league?.country === "International" ? (
                    <MyWorldTeamLogo
                      teamName={homeTeamData?.name}
                      teamLogo={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                      alt={homeTeamData?.name || 'Home Team'}
                      size="32px"
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
                      size="32px"
                    />
                  ) : (
                    <img
                      src={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                      alt={homeTeamData?.name || 'Home Team'}
                      className="w-6 h-6 object-contain rounded-full"
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/fallback-logo.svg';
                      }}
                    />
                  )}
                  <div className="text-slate-300 text-sm font-medium">
                    {currentEvent.player !== 'Team' ? currentEvent.player : getTeamDisplayName(currentEvent.team)}
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {currentEvent.minute}'
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Substitution indicators */}
          {currentEvent && currentEvent.type === 'substitution' && (
            <div>
              <div 
                className="absolute z-40 pointer-events-none"
                style={{
                  left: `${currentEvent.x || 50}%`,
                  top: `${(currentEvent.y || 50) - 8}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="bg-dangerPrimary text-whitePrimary rounded-full px-2 py-1 text-xs font-bold shadow-lg border-2 border-whitePrimary">
                  OUT
                </div>
                <div className="bg-surfaceSecondary rounded-md px-2 py-1 text-xs font-medium shadow-md mt-1 border border-dividerPrimary">
                  <div className="text-textSecondary text-xs">Player Out</div>
                  <div className="text-textPrimary font-medium">{currentEvent.player}</div>
                </div>
              </div>

              <div 
                className="absolute z-40 pointer-events-none"
                style={{
                  right: `${100 - (currentEvent.x || 50)}%`,
                  bottom: `${100 - (currentEvent.y || 50)}%`,
                  transform: 'translate(50%, 50%)'
                }}
              >
                <div className="bg-successPrimary text-whitePrimary rounded-full px-2 py-1 text-xs font-bold shadow-lg border-2 border-whitePrimary">
                  IN
                </div>
                <div className="bg-surfaceSecondary rounded-md px-2 py-1 text-xs font-medium shadow-md mt-1 border border-dividerPrimary">
                  <div className="text-accentPrimary font-medium">Player In</div>
                  <div className="text-textSecondary text-xs">Substitute</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Premium Corners Section */}
        <div className="bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-800/80 px-6 py-4 border-t border-slate-600/50 backdrop-blur-sm">
          <div className="text-center text-slate-300 text-sm font-bold mb-4 uppercase tracking-wider">
            🚩 Corner Kicks
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="relative">
                  {displayMatch.league?.country === "World" ||
                  displayMatch.league?.country === "International" ? (
                    <MyWorldTeamLogo
                      teamName={homeTeamData?.name}
                      teamLogo={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                      alt={homeTeamData?.name || 'Home Team'}
                      size="32px"
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
                      size="32px"
                    />
                  ) : (
                    <img
                      src={homeTeamData?.logo || '/assets/fallback-logo.svg'}
                      alt={homeTeamData?.name || 'Home Team'}
                      className="w-8 h-8 object-contain"
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/fallback-logo.svg';
                      }}
                    />
                  )}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg text-xl font-bold shadow-lg min-w-[50px] text-center">
                {cornerKicks.home}
              </div>
            </div>

            <div className="flex-1 mx-6">
              <div className="h-3 bg-slate-600/50 rounded-full overflow-hidden shadow-inner">
                <div className="h-full flex">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700 ease-out shadow-lg"
                    style={{ 
                      width: `${(cornerKicks.home / Math.max(cornerKicks.home + cornerKicks.away, 1)) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700 ease-out shadow-lg"
                    style={{ 
                      width: `${(cornerKicks.away / Math.max(cornerKicks.home + cornerKicks.away, 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-center text-slate-400 text-xs mt-2 font-medium">
                Total: {cornerKicks.home + cornerKicks.away}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-xl font-bold shadow-lg min-w-[50px] text-center">
                {cornerKicks.away}
              </div>
              <div className="relative">
                <img
                  src={awayTeamData?.logo || '/assets/fallback-logo.svg'}
                  alt={awayTeamData?.name || 'Away Team'}
                  className="w-8 h-8 object-contain rounded-full border-2 border-red-400/50 shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/fallback-logo.svg';
                  }}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyLiveAction;