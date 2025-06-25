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

interface AttackZone {
  id: string;
  team: 'home' | 'away';
  type: 'attacking' | 'ball_safe' | 'dangerous_attack';
  opacity: number;
  timestamp: number;
}

interface TeamStats {
  corners: { home: number; away: number };
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  fouls: { home: number; away: number };
  lastFiveMatches: {
    home: ('W' | 'L' | 'D')[];
    away: ('W' | 'L' | 'D')[];
  };
  previousMeetings: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
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
  const [attackZones, setAttackZones] = useState<AttackZone[]>([]);
  const [ballPossession, setBallPossession] = useState<'home' | 'away' | null>('home');
  const [teamStats, setTeamStats] = useState<TeamStats>({
    corners: { home: 0, away: 0 },
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    lastFiveMatches: {
      home: ['W', 'W', 'L', 'W', 'W'],
      away: ['W', 'W', 'W', 'W', 'D']
    },
    previousMeetings: { homeWins: 16, draws: 16, awayWins: 11 }
  });
  const [currentView, setCurrentView] = useState<'event' | 'stats' | 'history' | 'corners'>('event');

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

    fetchMatchData().then((match) => {
      if (match && mounted) {
        const status = match.fixture?.status?.short;
        const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

        if (isLive) {
          updateInterval = setInterval(() => {
            generateDynamicEvent();
          }, 15000); // Increased from 8s to 15s to reduce frequency
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
      setAttackZones([]);
    };
  }, [matchId]);

  // Dynamic ball movement and possession zones - optimized for better performance
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        const newX = Math.max(15, Math.min(85, prev.x + (Math.random() - 0.5) * 8)); // Reduced movement range
        const newY = Math.max(25, Math.min(75, prev.y + (Math.random() - 0.5) * 6)); // Reduced movement range

        // Update possession based on ball position
        if (newX < 40) {
          setBallPossession('home');
        } else if (newX > 60) {
          setBallPossession('away');
        } else {
          setBallPossession(null);
        }

        return { x: newX, y: newY };
      });
    }, 3000); // Increased from 1.2s to 3s to reduce frequency

    return () => clearInterval(ballInterval);
  }, [isLive]);

  // Generate dynamic events
  const generateDynamicEvent = () => {
    const teams = ['home', 'away'];
    const randomTeam = teams[Math.floor(Math.random() * teams.length)] as 'home' | 'away';
    
    // Determine event type based on ball position and actual penalty area boundaries
    let randomType: 'attacking' | 'ball_safe' | 'dangerous_attack';
    
    // Check if ball is actually INSIDE penalty areas for dangerous attack
    // Home penalty area: x < 21 (16 yards from goal line), y between 30-70
    // Away penalty area: x > 79 (16 yards from goal line), y between 30-70
    const isInHomePenalty = ballPosition.x < 21 && ballPosition.y > 30 && ballPosition.y < 70;
    const isInAwayPenalty = ballPosition.x > 79 && ballPosition.y > 30 && ballPosition.y < 70;
    
    if ((randomTeam === 'away' && isInHomePenalty) || (randomTeam === 'home' && isInAwayPenalty)) {
      randomType = 'dangerous_attack';
    } else if ((ballPosition.x < 40 && randomTeam === 'home') || (ballPosition.x > 60 && randomTeam === 'away')) {
      randomType = 'attacking';
    } else {
      randomType = 'ball_safe';
    }

    // Create attack zone
    const newZone: AttackZone = {
      id: `zone_${Date.now()}`,
      team: randomTeam,
      type: randomType,
      opacity: 0.3,
      timestamp: Date.now()
    };

    setAttackZones(prev => [newZone, ...prev.slice(0, 0)]);

    // Create corresponding event
    const eventDescriptions = {
      attacking: 'Attacking',
      ball_safe: 'Ball Safe',
      dangerous_attack: 'Dangerous Attack'
    };

    const newEvent: PlayByPlayEvent = {
      id: `event_${Date.now()}`,
      minute: elapsed,
      team: randomTeam,
      type: 'attack',
      player: randomTeam === 'home' ? homeTeamData?.name || 'Home Team' : awayTeamData?.name || 'Away Team',
      description: eventDescriptions[randomType],
      timestamp: Date.now(),
      isRecent: true
    };

    setCurrentEvent(newEvent);
    setPlayByPlayEvents(prev => [newEvent, ...prev.slice(0, 4)]);

    // Cycle through different views
    setTimeout(() => {
      const views: ('event' | 'stats' | 'history' | 'corners')[] = ['stats', 'history', 'corners'];
      const randomView = views[Math.floor(Math.random() * views.length)];
      setCurrentView(randomView);
    }, 3000);

    // Clear zone and reset view
    setTimeout(() => {
      setAttackZones(prev => prev.filter(z => z.id !== newZone.id));
      setCurrentView('event');
      setCurrentEvent(null);
    }, 6000);
  };

  const generatePlayByPlayEvents = async (matchData: any) => {
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

        recentEvents.forEach((event, index) => {
          const isHomeTeam = event.team?.id === homeTeam?.id;
          const team = isHomeTeam ? 'home' : 'away';

          let eventType = 'attempt';
          let description = event.detail || 'Match event';

          if (event.type === 'Goal') {
            eventType = 'goal';
            description = 'Goal kick';
          } else if (event.detail?.toLowerCase().includes('corner')) {
            eventType = 'corner';
            description = 'Corner kick';
          }

          events.push({
            id: `real_event_${event.time?.elapsed}_${index}`,
            minute: event.time?.elapsed || elapsed,
            team,
            type: eventType as any,
            player: event.player?.name || 'Player',
            description,
            timestamp: Date.now() - (index * 10000),
            isRecent: index === 0
          });
        });

        // Update team stats from real events
        const homeCorners = realEvents.filter(e => 
          e.team?.id === homeTeam?.id && e.detail?.toLowerCase().includes('corner')
        ).length;
        const awayCorners = realEvents.filter(e => 
          e.team?.id === awayTeam?.id && e.detail?.toLowerCase().includes('corner')
        ).length;

        setTeamStats(prev => ({
          ...prev,
          corners: { home: homeCorners, away: awayCorners }
        }));
      }

      setPlayByPlayEvents(events);
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

  const getMatchResult = (result: 'W' | 'L' | 'D') => {
    const colors = {
      W: 'bg-blue-500 text-white',
      L: 'bg-red-500 text-white', 
      D: 'bg-gray-400 text-white'
    };
    return colors[result];
  };

  return (
    <div className={`w-full ${className} professional-live-action`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
        {/* Header */}
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

        {/* Professional Football Field */}
        <div className="relative h-80 bg-gradient-to-br from-green-700 via-green-600 to-green-700 overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1e5631 0%, #2d7d32 25%, #388e3c 50%, #2d7d32 75%, #1e5631 100%)'
        }}>

          {/* Professional grass stripes */}
          <div className="absolute inset-0">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-full transition-all duration-500 grass-stripe"
                style={{
                  width: '4.16%',
                  left: `${i * 4.16}%`,
                  background: i % 2 === 0 
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.12)',
                  opacity: 0.6
                }}
              />
            ))}
          </div>

          {/* Attack zones - 365scores style */}
          {attackZones.map((zone) => (
            <div key={zone.id} className="absolute inset-0 pointer-events-none">
              <div 
                className={`absolute transition-all duration-1000 attack-zone ${
                  zone.type === 'dangerous_attack'
                    ? zone.team === 'home' 
                      ? 'bg-gradient-to-r from-blue-600/60 via-blue-700/70 to-blue-500/40' 
                      : 'bg-gradient-to-l from-red-600/60 via-red-700/70 to-red-500/40'
                    : zone.team === 'home' 
                      ? 'bg-gradient-to-r from-blue-500/45 via-blue-600/55 to-transparent' 
                      : 'bg-gradient-to-l from-red-500/45 via-red-600/55 to-transparent'
                }`}
                style={{
                  top: zone.type === 'dangerous_attack' ? '25%' : '20%',
                  bottom: zone.type === 'dangerous_attack' ? '25%' : '20%',
                  left: zone.team === 'home' ? (zone.type === 'dangerous_attack' ? '5%' : '10%') : '35%',
                  right: zone.team === 'home' ? '35%' : (zone.type === 'dangerous_attack' ? '5%' : '10%'),
                  clipPath: zone.team === 'home' 
                    ? zone.type === 'dangerous_attack' 
                      ? 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)'
                      : 'polygon(0% 0%, 70% 0%, 100% 50%, 70% 100%, 0% 100%)'
                    : zone.type === 'dangerous_attack'
                      ? 'polygon(15% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 50%)'
                      : 'polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%, 0% 50%)',
                  opacity: zone.type === 'dangerous_attack' ? 0.75 : 0.5
                }}
              />
            </div>
          ))}

          {/* Field markings - exact 365scores style */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <filter id="whiteGlow">
                <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Field boundary */}
            <rect x="5" y="15" width="90" height="70" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>

            {/* Center line */}
            <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>

            {/* Center circle */}
            <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>
            <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.9)"/>

            {/* Penalty areas */}
            <rect x="5" y="30" width="16" height="40" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>
            <rect x="79" y="30" width="16" height="40" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>

            {/* Goal areas */}
            <rect x="5" y="40" width="5.5" height="20" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>
            <rect x="89.5" y="40" width="5.5" height="20" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" filter="url(#whiteGlow)"/>

            {/* Corner arcs */}
            <path d="M 7 15 A 2 2 0 0 1 5 17" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" filter="url(#whiteGlow)"/>
            <path d="M 93 15 A 2 2 0 0 0 95 17" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" filter="url(#whiteGlow)"/>
            <path d="M 7 85 A 2 2 0 0 0 5 83" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" filter="url(#whiteGlow)"/>
            <path d="M 93 85 A 2 2 0 0 1 95 83" stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" filter="url(#whiteGlow)"/>
          </svg>

          {/* Professional ball with possession indicator */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-30"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Ball shadow */}
              <div className="absolute w-4 h-2 bg-black/30 rounded-full blur-sm" 
                   style={{ left: '-8px', top: '12px' }}></div>

              {/* Professional ball */}
              <div className="w-3 h-3 bg-white rounded-full shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>

                {/* Possession glow effect */}
                {ballPossession && (
                  <div className="absolute -inset-2">
                    <div className={`w-7 h-7 rounded-full animate-ping opacity-30 ${
                      ballPossession === 'home' ? 'bg-blue-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team positioning - 365scores style */}
          <div className="absolute top-4 left-4 z-40">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">👕</span>
              </div>
              <span className="text-white text-sm font-bold">
                {homeTeamData?.name?.toUpperCase().substring(0, 12) || 'HOME'}
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-40">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm font-bold">
                {awayTeamData?.name?.toUpperCase().substring(0, 12) || 'AWAY'}
              </span>
              <div className="w-4 h-4 bg-gray-300 rounded-sm flex items-center justify-center">
                <span className="text-gray-700 text-xs font-bold">👕</span>
              </div>
            </div>
          </div>

          {/* Current event display - exact 365scores style */}
          {currentEvent && currentView === 'event' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="text-center text-white">
                <div className="text-3xl font-bold mb-2">
                  {currentEvent.description}
                </div>
                <div className="text-xl font-semibold opacity-90">
                  {currentEvent.team === 'home' ? homeTeamData?.name?.toUpperCase() : awayTeamData?.name?.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Event notification card - top right */}
          {currentEvent && currentEvent.type === 'goal' && (
            <div className="absolute top-4 right-4 z-50">
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {currentEvent.minute}'
                </div>
                <span className="text-sm font-semibold">Goal kick</span>
                <div className="text-gray-500 text-xs">
                  {currentEvent.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom statistics panel - 365scores style */}
        <div className="bg-white border-t border-gray-100">
          {currentView === 'stats' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Free Kicks</span>
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {elapsed}'
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <span className="text-sm font-bold">SFE</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-blue-500 text-2xl font-bold">10</span>
                  <div className="w-12 h-12 relative">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none"/>
                      <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="4" fill="none"
                              strokeDasharray={`${(teamStats.possession.home/100) * 125.6} 125.6`}/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">⚽</span>
                    </div>
                  </div>
                  <span className="text-red-500 text-2xl font-bold">9</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">DIM</span>
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'history' && (
            <div className="p-4">
              <div className="text-center mb-3">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Last 5 Matches</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <div className="flex gap-1">
                    {teamStats.lastFiveMatches.home.map((result, i) => (
                      <div key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${getMatchResult(result)}`}>
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {teamStats.lastFiveMatches.away.map((result, i) => (
                      <div key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${getMatchResult(result)}`}>
                        {result}
                      </div>
                    ))}
                  </div>
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'corners' && (
            <div className="p-4">
              <div className="text-center mb-3">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Corners</span>
              </div>
              <div className="flex items-center justify-center gap-12">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <span className="text-blue-500 text-3xl font-bold">{teamStats.corners.home}</span>
                </div>
                <div className="w-24 h-1 bg-gray-200 rounded relative">
                  <div 
                    className="h-full bg-blue-500 rounded transition-all duration-1000"
                    style={{ 
                      width: `${teamStats.corners.home > 0 ? (teamStats.corners.home / (teamStats.corners.home + teamStats.corners.away)) * 100 : 50}%` 
                    }}
                  ></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-3xl font-bold">{teamStats.corners.away}</span>
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLiveAction;