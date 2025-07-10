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
  playerOut?: string;
  playerIn?: string;
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
  const [currentView, setCurrentView] = useState<'event' | 'stats' | 'history' | 'corners' | 'shotmap'>('event');
  const [ballTarget, setBallTarget] = useState({ x: 50, y: 50 });
  const [shotEvents, setShotEvents] = useState<Array<{id: string, x: number, y: number, team: 'home' | 'away', isGoal: boolean, timestamp: number}>>([]);

  // Determine if match is currently live
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;
  
  // Debug logging for status detection
  console.log(`🔍 [Live Action] Match ${matchId} status check:`, {
    currentStatus,
    isLive,
    elapsed,
    fixtureStatus: displayMatch?.fixture?.status
  });

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

  // Intelligent ball movement with football patterns
  const [ballTrail, setBallTrail] = useState<Array<{x: number, y: number, timestamp: number}>>([]);

  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition(prev => {
        // Move towards target with some randomness for realistic play
        const deltaX = ballTarget.x - prev.x;
        const deltaY = ballTarget.y - prev.y;
        
        const moveSpeed = 0.3; // Smooth movement speed
        const randomFactor = 3; // Reduced randomness for more purposeful movement
        
        let newX = prev.x + (deltaX * moveSpeed) + (Math.random() - 0.5) * randomFactor;
        let newY = prev.y + (deltaY * moveSpeed) + (Math.random() - 0.5) * randomFactor;
        
        // Keep ball within field bounds
        newX = Math.max(10, Math.min(90, newX));
        newY = Math.max(20, Math.min(80, newY));

        // Update possession based on ball position with more realistic zones
        if (newX < 35) {
          setBallPossession('home');
        } else if (newX > 65) {
          setBallPossession('away');
        } else {
          setBallPossession(Math.random() > 0.5 ? 'home' : 'away');
        }

        // Add to trail - reduced trail length to avoid double lines
        setBallTrail(currentTrail => {
          const newTrail = [...currentTrail, { x: prev.x, y: prev.y, timestamp: Date.now() }];
          return newTrail.slice(-8); // Shorter trail for cleaner look
        });

        return { x: newX, y: newY };
      });
    }, 300); // Smoother movement interval

    return () => clearInterval(ballInterval);
  }, [isLive, ballTarget]);

  // Set new ball targets for realistic football movement patterns
  useEffect(() => {
    if (!isLive) return;

    const targetInterval = setInterval(() => {
      const patterns = [
        // Attack patterns
        { x: Math.random() > 0.5 ? 85 : 15, y: 45 + (Math.random() - 0.5) * 20 }, // Goal area attacks
        { x: Math.random() > 0.5 ? 75 : 25, y: 30 + Math.random() * 40 }, // Wing attacks
        { x: 50, y: 50 }, // Center field
        // Defensive patterns
        { x: Math.random() > 0.5 ? 30 : 70, y: 35 + Math.random() * 30 }, // Defensive thirds
      ];
      
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      setBallTarget(randomPattern);
    }, 2000); // Change target every 2 seconds

    return () => clearInterval(targetInterval);
  }, [isLive]);

  // Clean up old trail positions, goal kick events, and corner kick events
  useEffect(() => {
    const cleanup = setInterval(() => {
      setBallTrail(currentTrail => 
        currentTrail.filter(pos => Date.now() - pos.timestamp < 10000) // Keep trail for 10 seconds
      );
      
      setGoalKickEvents(current => 
        current.filter(event => Date.now() - event.timestamp < 8000) // Keep goal kicks for 8 seconds
      );
      
      setCornerKickEvents(current => 
        current.filter(event => Date.now() - event.timestamp < 8000) // Keep corner kicks for 8 seconds
      );
      
      setSubstitutionEvents(current => 
        current.filter(event => Date.now() - event.timestamp < 12000) // Keep substitutions for 12 seconds
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // State for goal kick effects
  const [goalKickEvents, setGoalKickEvents] = useState<Array<{id: string, x: number, y: number, team: 'home' | 'away', timestamp: number}>>([]);
  
  // State for corner kick effects
  const [cornerKickEvents, setCornerKickEvents] = useState<Array<{id: string, x: number, y: number, team: 'home' | 'away', timestamp: number, corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'}>>([]);
  
  // State for substitution effects
  const [substitutionEvents, setSubstitutionEvents] = useState<Array<{id: string, team: 'home' | 'away', playerOut: string, playerIn: string, timestamp: number}>>([]);

  // Generate dynamic events including shots, goal kicks, and corner kicks
  const generateDynamicEvent = () => {
    const teams = ['home', 'away'];
    const randomTeam = teams[Math.floor(Math.random() * teams.length)] as 'home' | 'away';
    
    // Determine event type based on ball position and actual penalty area boundaries
    let randomType: 'attacking' | 'ball_safe' | 'dangerous_attack';
    let eventType: 'attack' | 'shot' | 'goal' | 'goalkick' | 'corner' | 'substitution' = 'attack';
    
    // Check if ball is actually INSIDE penalty areas for dangerous attack
    const isInHomePenalty = ballPosition.x < 21 && ballPosition.y > 30 && ballPosition.y < 70;
    const isInAwayPenalty = ballPosition.x > 79 && ballPosition.y > 30 && ballPosition.y < 70;
    
    // Check if ball is in goal area for goal kick
    const isInHomeGoalArea = ballPosition.x < 11 && ballPosition.y > 40 && ballPosition.y < 60;
    const isInAwayGoalArea = ballPosition.x > 89 && ballPosition.y > 40 && ballPosition.y < 60;
    
    // Check if ball is in corner areas for corner kick
    const isInTopLeftCorner = ballPosition.x < 10 && ballPosition.y < 20;
    const isInTopRightCorner = ballPosition.x > 90 && ballPosition.y < 20;
    const isInBottomLeftCorner = ballPosition.x < 10 && ballPosition.y > 80;
    const isInBottomRightCorner = ballPosition.x > 90 && ballPosition.y > 80;
    
    if (isInTopLeftCorner || isInTopRightCorner || isInBottomLeftCorner || isInBottomRightCorner) {
      eventType = 'corner';
      randomType = 'attacking';
      
      // Determine corner position
      let corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      if (isInTopLeftCorner) corner = 'top-left';
      else if (isInTopRightCorner) corner = 'top-right';
      else if (isInBottomLeftCorner) corner = 'bottom-left';
      else corner = 'bottom-right';
      
      // Create corner kick event
      const cornerKickEvent = {
        id: `corner_${Date.now()}`,
        x: ballPosition.x,
        y: ballPosition.y,
        team: randomTeam,
        corner,
        timestamp: Date.now()
      };
      
      setCornerKickEvents(prev => [...prev.slice(-4), cornerKickEvent]); // Keep last 5 corner kicks
      
    } else if (isInHomeGoalArea || isInAwayGoalArea) {
      eventType = 'goalkick';
      randomType = 'ball_safe';
      
      // Create goal kick event
      const goalKickEvent = {
        id: `goalkick_${Date.now()}`,
        x: ballPosition.x,
        y: ballPosition.y,
        team: randomTeam,
        timestamp: Date.now()
      };
      
      setGoalKickEvents(prev => [...prev.slice(-4), goalKickEvent]); // Keep last 5 goal kicks
      
    } else if ((randomTeam === 'away' && isInHomePenalty) || (randomTeam === 'home' && isInAwayPenalty)) {
      randomType = 'dangerous_attack';
      // High chance of shot in penalty area
      if (Math.random() > 0.4) {
        eventType = Math.random() > 0.8 ? 'goal' : 'shot';
        
        // Create shot event
        const shotEvent = {
          id: `shot_${Date.now()}`,
          x: ballPosition.x,
          y: ballPosition.y,
          team: randomTeam,
          isGoal: eventType === 'goal',
          timestamp: Date.now()
        };
        
        setShotEvents(prev => [...prev.slice(-9), shotEvent]); // Keep last 10 shots
        
        // Update team stats
        setTeamStats(prev => ({
          ...prev,
          shots: {
            ...prev.shots,
            [randomTeam]: prev.shots[randomTeam] + 1
          }
        }));
      }
    } else if ((ballPosition.x < 40 && randomTeam === 'home') || (ballPosition.x > 60 && randomTeam === 'away')) {
      randomType = 'attacking';
      // Medium chance of shot in attacking third
      if (Math.random() > 0.7) {
        eventType = 'shot';
        
        const shotEvent = {
          id: `shot_${Date.now()}`,
          x: ballPosition.x,
          y: ballPosition.y,
          team: randomTeam,
          isGoal: false,
          timestamp: Date.now()
        };
        
        setShotEvents(prev => [...prev.slice(-9), shotEvent]);
        
        setTeamStats(prev => ({
          ...prev,
          shots: {
            ...prev.shots,
            [randomTeam]: prev.shots[randomTeam] + 1
          }
        }));
      }
    } else {
      randomType = 'ball_safe';
      
      // Random chance for substitution (about 10% chance)
      if (Math.random() > 0.9) {
        eventType = 'substitution';
        
        // Generate player names for substitution
        const playerNames = [
          'Rodriguez', 'Silva', 'Martinez', 'Garcia', 'Lopez', 'Gonzalez', 
          'Fernandez', 'Sanchez', 'Perez', 'Morales', 'Johnson', 'Smith',
          'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'
        ];
        
        const playerOut = playerNames[Math.floor(Math.random() * playerNames.length)];
        const playerIn = playerNames[Math.floor(Math.random() * playerNames.length)];
        
        // Create substitution event
        const substitutionEvent = {
          id: `substitution_${Date.now()}`,
          team: randomTeam,
          playerOut,
          playerIn,
          timestamp: Date.now()
        };
        
        setSubstitutionEvents(prev => [...prev.slice(-4), substitutionEvent]);
      }
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
      attacking: eventType === 'shot' ? 'Shot Attempt' : eventType === 'corner' ? 'Corner kick' : eventType === 'substitution' ? 'Substitution' : 'Attacking',
      ball_safe: eventType === 'goalkick' ? 'Goal kick' : eventType === 'substitution' ? 'Substitution' : 'Ball Safe',
      dangerous_attack: eventType === 'goal' ? 'GOAL!' : eventType === 'shot' ? 'Shot on Target' : 'Dangerous Attack'
    };

    const newEvent: PlayByPlayEvent = {
      id: `event_${Date.now()}`,
      minute: elapsed,
      team: randomTeam,
      type: eventType as any,
      player: randomTeam === 'home' ? homeTeamData?.name || 'Home Team' : awayTeamData?.name || 'Away Team',
      description: eventDescriptions[randomType],
      timestamp: Date.now(),
      isRecent: true
    };

    setCurrentEvent(newEvent);
    setPlayByPlayEvents(prev => [newEvent, ...prev.slice(0, 4)]);

    // Cycle through different views including shot map
    setTimeout(() => {
      const views: ('event' | 'stats' | 'history' | 'corners' | 'shotmap')[] = ['stats', 'history', 'corners', 'shotmap'];
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

  // Don't render anything for finished matches - let MyHighlights handle it
  if (currentStatus === "FT" || currentStatus === "AET" || currentStatus === "PEN") {
    console.log(`🏁 [Live Action] Match ${matchId} is finished (status: ${currentStatus}), not rendering Live Action`);
    return null;
  }

  if (!displayMatch) {
    console.log(`❌ [Live Action] No match data for match ${matchId}`);
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Action</span>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mb-1 font-medium">Match data not available</p>
              <p className="text-xs opacity-60 mb-2">
                {homeTeamData?.name || homeTeam?.name || homeTeam} vs {awayTeamData?.name || awayTeam?.name || awayTeam}
              </p>
              <p className="text-xs text-gray-400">
                Live tracking is only available during active matches
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    console.log(`⏸️ [Live Action] Match ${matchId} is not live (status: ${currentStatus})`);
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Action</span>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mb-1 font-medium">Match not live</p>
              <p className="text-xs opacity-60 mb-2">
                {homeTeamData?.name} vs {awayTeamData?.name}
              </p>
              <p className="text-xs text-gray-400">
                Status: {currentStatus || 'Unknown'} • Live action will appear when match is in progress
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
        <div className="relative h-96 bg-gradient-to-br from-green-700 via-green-600 to-green-700 overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1e5631 0%, #2d7d32 25%, #388e3c 50%, #2d7d32 75%, #1e5631 100%)',
          minHeight: '400px'
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
          <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
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

          {/* Straight ball trail lines between positions */}
          {ballTrail.length > 1 && (
            <svg className="absolute inset-0 w-full h-full z-35 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Draw straight lines between consecutive positions */}
              {ballTrail.slice(0, -1).map((pos, index) => {
                const nextPos = ballTrail[index + 1];
                return (
                  <g key={`trail-${index}`}>
                    {/* Main straight line */}
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={nextPos.x}
                      y2={nextPos.y}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      className="opacity-95"
                    />
                    {/* Glowing effect for better visibility */}
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={nextPos.x}
                      y2={nextPos.y}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      className="opacity-60"
                      filter="blur(0.5px)"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Shot events visualization */}
          {shotEvents.map((shot) => (
            <div
              key={shot.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-45 pointer-events-none"
              style={{
                left: `${shot.x}%`,
                top: `${shot.y}%`,
              }}
            >
              <div className={`w-3 h-3 rounded-full ${
                shot.isGoal 
                  ? 'bg-green-500 ring-2 ring-green-300' 
                  : shot.team === 'home' 
                    ? 'bg-blue-500 ring-2 ring-blue-300' 
                    : 'bg-red-500 ring-2 ring-red-300'
                } animate-ping`}
                style={{ animationDuration: '2s' }}
              ></div>
            </div>
          ))}

          {/* Goal kick effects */}
          {goalKickEvents.map((goalKick) => (
            <div key={goalKick.id} className="absolute inset-0 pointer-events-none z-40">
              {/* Goal kick trajectory fan */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`goalKickGradient-${goalKick.team}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={goalKick.team === 'home' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'} />
                    <stop offset="100%" stopColor={goalKick.team === 'home' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'} />
                  </linearGradient>
                  <radialGradient id={`goalKickRadial-${goalKick.team}`} cx="0%" cy="50%" r="60%">
                    <stop offset="0%" stopColor={goalKick.team === 'home' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'} />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
                  </radialGradient>
                </defs>
                
                {/* Triangular trajectory area */}
                <path
                  d={goalKick.team === 'home' 
                    ? `M ${goalKick.x},${goalKick.y} L 50,25 L 50,75 Z`
                    : `M ${goalKick.x},${goalKick.y} L 50,25 L 50,75 Z`
                  }
                  fill={`url(#goalKickGradient-${goalKick.team})`}
                  opacity="0.6"
                  className="animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
                
                {/* Goal kick area highlight */}
                <circle
                  cx={goalKick.x}
                  cy={goalKick.y}
                  r="8"
                  fill={`url(#goalKickRadial-${goalKick.team})`}
                  opacity="0.8"
                  className="animate-ping"
                  style={{ animationDuration: '1.5s' }}
                />
                
                {/* Multiple trajectory lines */}
                {[15, 30, 45, 60, 75].map((angle, index) => (
                  <line
                    key={index}
                    x1={goalKick.x}
                    y1={goalKick.y}
                    x2={goalKick.team === 'home' ? goalKick.x + 40 : goalKick.x - 40}
                    y2={goalKick.y + (angle - 45) * 0.8}
                    stroke={goalKick.team === 'home' ? '#3b82f6' : '#ef4444'}
                    strokeWidth="0.3"
                    opacity="0.4"
                    strokeDasharray="1,0.5"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                ))}
              </svg>
            </div>
          ))}

          {/* Corner kick effects */}
          {cornerKickEvents.map((corner) => {
            // Determine corner flag position and goal target
            let cornerX, cornerY, goalX, goalY;
            
            switch (corner.corner) {
              case 'top-left':
                cornerX = 5; cornerY = 15;
                goalX = corner.team === 'home' ? 95 : 5;
                goalY = 50;
                break;
              case 'top-right':
                cornerX = 95; cornerY = 15;
                goalX = corner.team === 'home' ? 95 : 5;
                goalY = 50;
                break;
              case 'bottom-left':
                cornerX = 5; cornerY = 85;
                goalX = corner.team === 'home' ? 95 : 5;
                goalY = 50;
                break;
              case 'bottom-right':
                cornerX = 95; cornerY = 85;
                goalX = corner.team === 'home' ? 95 : 5;
                goalY = 50;
                break;
            }

            return (
              <div key={corner.id} className="absolute inset-0 pointer-events-none z-42">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`cornerGradient-${corner.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={corner.team === 'home' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'} />
                      <stop offset="100%" stopColor={corner.team === 'home' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'} />
                    </linearGradient>
                  </defs>
                  
                  {/* Corner flag marker */}
                  <circle
                    cx={cornerX}
                    cy={cornerY}
                    r="2"
                    fill={corner.team === 'home' ? '#3b82f6' : '#ef4444'}
                    className="animate-ping"
                    style={{ animationDuration: '1.5s' }}
                  />
                  
                  {/* Corner flag pole */}
                  <line
                    x1={cornerX}
                    y1={cornerY}
                    x2={cornerX}
                    y2={cornerY - 3}
                    stroke="white"
                    strokeWidth="0.3"
                    opacity="0.8"
                  />
                  
                  {/* Curved trajectory path - similar to 365scores style */}
                  <path
                    d={`M ${cornerX} ${cornerY} Q ${(cornerX + goalX) / 2} ${Math.min(cornerY, goalY) - 15} ${goalX} ${goalY}`}
                    stroke={corner.team === 'home' ? '#3b82f6' : '#ef4444'}
                    strokeWidth="0.6"
                    fill="none"
                    strokeDasharray="2,1"
                    opacity="0.7"
                    className="animate-pulse"
                    style={{ animationDuration: '2s' }}
                  />
                  
                  {/* Dotted trajectory lines */}
                  <path
                    d={`M ${cornerX} ${cornerY} Q ${(cornerX + goalX) / 2} ${Math.min(cornerY, goalY) - 12} ${goalX - 5} ${goalY - 8}`}
                    stroke={corner.team === 'home' ? '#3b82f6' : '#ef4444'}
                    strokeWidth="0.4"
                    fill="none"
                    strokeDasharray="1,0.8"
                    opacity="0.5"
                    className="animate-pulse"
                    style={{ animationDelay: '0.3s', animationDuration: '2s' }}
                  />
                  
                  <path
                    d={`M ${cornerX} ${cornerY} Q ${(cornerX + goalX) / 2} ${Math.min(cornerY, goalY) - 18} ${goalX - 8} ${goalY + 8}`}
                    stroke={corner.team === 'home' ? '#3b82f6' : '#ef4444'}
                    strokeWidth="0.4"
                    fill="none"
                    strokeDasharray="1,0.8"
                    opacity="0.5"
                    className="animate-pulse"
                    style={{ animationDelay: '0.6s', animationDuration: '2s' }}
                  />
                  
                  {/* Target area highlight */}
                  <circle
                    cx={goalX}
                    cy={goalY}
                    r="6"
                    fill="none"
                    stroke={corner.team === 'home' ? '#3b82f6' : '#ef4444'}
                    strokeWidth="0.5"
                    strokeDasharray="2,1"
                    opacity="0.6"
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                </svg>
              </div>
            );
          })}

          {/* Shot direction indicators */}
          {shotEvents.slice(-3).map((shot) => (
            <svg
              key={`arrow-${shot.id}`}
              className="absolute inset-0 w-full h-full z-44 pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <marker id={`arrowhead-${shot.team}`} markerWidth="10" markerHeight="7" 
                        refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" 
                          fill={shot.team === 'home' ? '#3b82f6' : '#ef4444'} />
                </marker>
              </defs>
              <line
                x1={shot.x}
                y1={shot.y}
                x2={shot.team === 'home' ? '95' : '5'}
                y2="50"
                stroke={shot.team === 'home' ? '#3b82f6' : '#ef4444'}
                strokeWidth="0.5"
                markerEnd={`url(#arrowhead-${shot.team})`}
                opacity="0.6"
                strokeDasharray="2,1"
              />
            </svg>
          ))}

          {/* Professional ball with possession indicator */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-400 ease-out z-50"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Enhanced ball shadow with movement */}
              <div className="absolute w-5 h-2 bg-black/40 rounded-full blur-md animate-pulse" 
                   style={{ left: '-10px', top: '14px' }}></div>

              {/* Professional ball - larger and more dynamic */}
              <div className="w-5 h-5 bg-white rounded-full shadow-2xl relative overflow-hidden border border-gray-200 animate-spin-slow">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/50 to-transparent"></div>
                {/* Enhanced soccer ball pattern */}
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full opacity-70"></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-black rounded-full opacity-60"></div>
                  <div className="absolute top-2 right-1.5 w-0.5 h-0.5 bg-black rounded-full opacity-50"></div>
                </div>

                {/* Enhanced possession glow effect */}
                {ballPossession && (
                  <div className="absolute -inset-3">
                    <div className={`w-11 h-11 rounded-full animate-ping opacity-40 ${
                      ballPossession === 'home' ? 'bg-blue-400' : 'bg-red-400'
                    }`}></div>
                    <div className={`absolute inset-1 w-9 h-9 rounded-full animate-pulse opacity-20 ${
                      ballPossession === 'home' ? 'bg-blue-300' : 'bg-red-300'
                    }`}></div>
                  </div>
                )}
              </div>

              {/* Enhanced speed lines effect */}
              <div className="absolute -inset-2 pointer-events-none">
                <div className="w-8 h-0.5 bg-white/30 rounded-full blur-sm animate-pulse" 
                     style={{ transform: 'rotate(-15deg)', left: '-6px', top: '9px' }}></div>
                <div className="w-6 h-0.5 bg-white/25 rounded-full blur-sm animate-pulse" 
                     style={{ transform: 'rotate(-25deg)', left: '-3px', top: '11px' }}></div>
                <div className="w-4 h-0.5 bg-white/20 rounded-full blur-sm animate-pulse" 
                     style={{ transform: 'rotate(-35deg)', left: '-1px', top: '13px' }}></div>
              </div>

              {/* Movement direction indicator */}
              <div className="absolute -top-1 -right-1 w-2 h-2 pointer-events-none">
                <div className="w-full h-full bg-white/60 rounded-full animate-bounce" 
                     style={{ animationDuration: '0.8s' }}></div>
              </div>
            </div>
          </div>

          

          {/* Substitution effects */}
          {substitutionEvents.map((substitution) => (
            <div key={substitution.id} className="absolute inset-0 pointer-events-none z-45">
              {/* Substitution banner overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                <div className="bg-white rounded-lg shadow-lg px-6 py-4 text-center min-w-80">
                  <div className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wide">
                    SUBSTITUTION
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                        <span className="text-sm font-semibold text-red-600">OUT</span>
                      </div>
                      <div className="text-sm font-bold">{substitution.playerOut}</div>
                    </div>
                    <div className="mx-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-green-600">IN</span>
                        <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                      </div>
                      <div className="text-sm font-bold">{substitution.playerIn}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {substitution.team === 'home' ? homeTeamData?.name : awayTeamData?.name}
                  </div>
                </div>
              </div>
              
              {/* Substitution area highlight on field */}
              <div className={`absolute ${substitution.team === 'home' ? 'left-0' : 'right-0'} top-1/4 bottom-1/4 w-16 bg-gradient-to-r ${
                substitution.team === 'home' 
                  ? 'from-blue-500/30 to-transparent' 
                  : 'from-transparent to-red-500/30'
              } animate-pulse`}
                   style={{ animationDuration: '2s' }}
              ></div>
            </div>
          ))}

          {/* Penalty Shootout Display */}
          {currentStatus === 'P' && (
            <div className="absolute inset-0 z-50">
              {/* Penalty Action Banner */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                  PEN
                </div>
                <span className="text-sm font-semibold">Rojas, Andy</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                  <span className="text-orange-500 font-bold text-xs">MISSED</span>
                </div>
              </div>

              {/* Penalty Shootout Results */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t-4 border-green-600">
                <div className="text-center py-2">
                  <span className="text-gray-600 text-sm font-semibold uppercase tracking-wider">PENALTY SHOOTOUT</span>
                </div>
                
                <div className="flex justify-between items-center px-6 pb-4">
                  {/* Home Team Penalties */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MyCircularFlag 
                        countryName={homeTeamData?.name?.includes('USA') ? 'United States' : 'Unknown'}
                        size="w-6 h-6"
                      />
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((penalty) => (
                        <div key={penalty} className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            penalty <= 4 
                              ? penalty === 4 
                                ? 'bg-red-500 text-white' // Miss
                                : 'bg-blue-500 text-white' // Goal
                              : 'bg-gray-200 text-gray-400' // Not taken
                          }`}>
                            {penalty <= 4 ? (penalty === 4 ? '✕' : '✓') : '○'}
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{penalty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">2 - 2</div>
                    <div className="text-xs text-gray-500">After penalties</div>
                  </div>

                  {/* Away Team Penalties */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((penalty) => (
                        <div key={penalty} className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            penalty <= 5 
                              ? penalty === 3 || penalty === 5
                                ? 'bg-red-500 text-white' // Miss
                                : 'bg-red-500 text-white' // Goal
                              : 'bg-gray-200 text-gray-400' // Not taken
                          }`}>
                            {penalty <= 5 ? (penalty === 3 || penalty === 5 ? '✕' : '✓') : '○'}
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{penalty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <MyCircularFlag 
                        countryName={awayTeamData?.name?.includes('Costa Rica') ? 'Costa Rica' : 'Unknown'}
                        size="w-6 h-6"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Corners display - always visible */}
          <div className="absolute top-4 left-4 z-50">
            <div className="bg-white rounded-lg shadow-lg px-4 py-2">
              <div className="text-center mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Corners</span>
              </div>
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <span className="text-blue-500 text-xl font-bold">{teamStats.corners.home}</span>
                </div>
                <div className="w-16 h-1 bg-gray-200 rounded relative">
                  <div 
                    className="h-full bg-blue-500 rounded transition-all duration-1000"
                    style={{ 
                      width: `${teamStats.corners.home > 0 ? (teamStats.corners.home / (teamStats.corners.home + teamStats.corners.away)) * 100 : 50}%` 
                    }}
                  ></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-xl font-bold">{teamStats.corners.away}</span>
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Current event display - exact 365scores style */}
          {currentEvent && currentView === 'event' && currentStatus !== 'P' && (
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
          {currentEvent && (currentEvent.type === 'goal' || currentEvent.type === 'goalkick' || currentEvent.type === 'corner' || currentEvent.type === 'substitution') && (
            <div className="absolute top-4 right-4 z-50">
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                <div className={`text-white px-2 py-1 rounded text-xs font-bold ${
                  currentEvent.type === 'goalkick' ? 'bg-blue-500' : 
                  currentEvent.type === 'corner' ? 'bg-yellow-500' : 
                  currentEvent.type === 'substitution' ? 'bg-purple-500' : 'bg-red-500'
                }`}>
                  {currentEvent.minute}'
                </div>
                <span className="text-sm font-semibold">
                  {currentEvent.type === 'goalkick' ? 'Goal kick' : 
                   currentEvent.type === 'corner' ? 'Corner kick' : 
                   currentEvent.type === 'substitution' ? 'Substitution' : 'Goal'}
                </span>
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

          {currentView === 'shotmap' && (
            <div className="p-4">
              <div className="text-center mb-3">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Shot Map</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <span className="text-blue-500 text-xl font-bold">{teamStats.shots.home}</span>
                  <span className="text-xs text-gray-500">shots</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Goal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Home Shot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Away Shot</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">shots</span>
                  <span className="text-red-500 text-xl font-bold">{teamStats.shots.away}</span>
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                </div>
              </div>
              
              {/* Mini shot map */}
              <div className="relative h-16 bg-green-600 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-green-700 opacity-90">
                  {/* Mini field markings */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-8 border border-white/50"></div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-8 border border-white/50"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50"></div>
                  
                  {/* Shot markers on mini map */}
                  {shotEvents.slice(-10).map((shot) => (
                    <div
                      key={`mini-${shot.id}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${shot.x}%`,
                        top: `${((shot.y - 20) / 60) * 100}%`, // Adjust for mini map scale
                      }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        shot.isGoal 
                          ? 'bg-green-400 ring-1 ring-green-200' 
                          : shot.team === 'home' 
                            ? 'bg-blue-400' 
                            : 'bg-red-400'
                        }`}></div>
                    </div>
                  ))}
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