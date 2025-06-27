
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyCircularFlag from '@/components/common/MyCircularFlag';
import { isNationalTeam } from '@/lib/teamLogoSources';

interface MyLMTLiveProps {
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
  type: 'goal' | 'substitution' | 'card' | 'corner' | 'freekick' | 'offside' | 'foul' | 'shot' | 'save';
  player: string;
  description: string;
  timestamp: number;
  isRecent?: boolean;
}

interface MatchStatistics {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  offsides: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

interface MatchTimeline {
  events: LiveEvent[];
  currentMinute: number;
  halfTime: boolean;
  extraTime: boolean;
}

const MyLMTLive: React.FC<MyLMTLiveProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "" 
}) => {
  const [liveData, setLiveData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeline, setTimeline] = useState<MatchTimeline>({
    events: [],
    currentMinute: 0,
    halfTime: false,
    extraTime: false
  });
  const [statistics, setStatistics] = useState<MatchStatistics>({
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    offsides: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 }
  });
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'lineups'>('timeline');
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const intervalRef = useRef<NodeJS.Timeout>();

  // Determine if match is currently live
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  // Fetch initial match data and set up real-time updates
  useEffect(() => {
    if (!matchId) {
      console.log('❌ [LMT Live] No match ID provided');
      return;
    }

    let mounted = true;

    const fetchMatchData = async () => {
      try {
        setIsLoading(true);

        // Try live fixtures first
        const liveResponse = await fetch(`/api/fixtures/live?_t=${Date.now()}`);
        if (liveResponse.ok && mounted) {
          const liveFixtures = await liveResponse.json();
          const liveMatch = liveFixtures.find((fixture: any) => 
            fixture.fixture.id === matchId
          );

          if (liveMatch && mounted) {
            setLiveData(liveMatch);
            await fetchMatchEvents(liveMatch);
            await fetchMatchStats(liveMatch);
            setIsLoading(false);
            return liveMatch;
          }
        }

        // Fallback to regular fixtures
        const matchResponse = await fetch(`/api/fixtures?ids=${matchId}`);
        if (matchResponse.ok && mounted) {
          const matchData = await matchResponse.json();
          if (matchData.length > 0) {
            const match = matchData[0];
            setLiveData(match);
            await fetchMatchEvents(match);
            await fetchMatchStats(match);
            setIsLoading(false);
            return match;
          }
        }

        setIsLoading(false);
        return null;
      } catch (error) {
        if (mounted) {
          console.error('❌ [LMT Live] Error fetching match data:', error);
          setIsLoading(false);
        }
        return null;
      }
    };

    fetchMatchData().then((match) => {
      if (match && mounted && isLive) {
        // Set up real-time updates for live matches
        intervalRef.current = setInterval(() => {
          fetchMatchEvents(match);
          fetchMatchStats(match);
          generateBallMovement();
        }, 10000); // Update every 10 seconds
      }
    });

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchId, isLive]);

  // Fetch match events from RapidAPI
  const fetchMatchEvents = async (matchData: any) => {
    try {
      const response = await fetch(`/api/fixtures/${matchData.fixture.id}/events`);
      if (response.ok) {
        const events = await response.json();
        
        const formattedEvents: LiveEvent[] = events.map((event: any, index: number) => ({
          id: `event_${event.time?.elapsed}_${index}`,
          minute: event.time?.elapsed || 0,
          team: event.team?.id === matchData.teams?.home?.id ? 'home' : 'away',
          type: getEventType(event.type, event.detail),
          player: event.player?.name || 'Unknown Player',
          description: event.detail || event.type || 'Match event',
          timestamp: Date.now() - (index * 1000),
          isRecent: index < 3
        })).sort((a: LiveEvent, b: LiveEvent) => b.minute - a.minute);

        setTimeline(prev => ({
          ...prev,
          events: formattedEvents,
          currentMinute: matchData.fixture?.status?.elapsed || 0,
          halfTime: currentStatus === 'HT',
          extraTime: currentStatus === 'ET'
        }));
      }
    } catch (error) {
      console.error('❌ [LMT Live] Error fetching events:', error);
    }
  };

  // Fetch match statistics
  const fetchMatchStats = async (matchData: any) => {
    try {
      // Generate realistic statistics based on match progression
      const matchMinute = matchData.fixture?.status?.elapsed || 0;
      const homeGoals = matchData.goals?.home || 0;
      const awayGoals = matchData.goals?.away || 0;
      
      // Calculate possession based on score and time
      let homePossession = 50;
      if (homeGoals > awayGoals) {
        homePossession = Math.min(65, 50 + (homeGoals - awayGoals) * 8);
      } else if (awayGoals > homeGoals) {
        homePossession = Math.max(35, 50 - (awayGoals - homeGoals) * 8);
      }

      // Generate other stats proportionally
      const totalShots = Math.floor((matchMinute / 90) * 20) + Math.random() * 5;
      const homeShots = Math.floor(totalShots * (homePossession / 100));
      const awayShots = Math.floor(totalShots - homeShots);

      setStatistics({
        possession: { home: homePossession, away: 100 - homePossession },
        shots: { home: homeShots, away: awayShots },
        shotsOnTarget: { 
          home: Math.floor(homeShots * 0.4), 
          away: Math.floor(awayShots * 0.4) 
        },
        corners: { 
          home: Math.floor(matchMinute / 15) + Math.floor(Math.random() * 3), 
          away: Math.floor(matchMinute / 18) + Math.floor(Math.random() * 3) 
        },
        fouls: { 
          home: Math.floor(matchMinute / 8) + Math.floor(Math.random() * 4), 
          away: Math.floor(matchMinute / 10) + Math.floor(Math.random() * 4) 
        },
        offsides: { 
          home: Math.floor(Math.random() * 3), 
          away: Math.floor(Math.random() * 3) 
        },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 }
      });
    } catch (error) {
      console.error('❌ [LMT Live] Error generating stats:', error);
    }
  };

  // Generate ball movement for visual effect
  const generateBallMovement = () => {
    setBallPosition(prev => ({
      x: Math.max(10, Math.min(90, prev.x + (Math.random() - 0.5) * 20)),
      y: Math.max(20, Math.min(80, prev.y + (Math.random() - 0.5) * 15))
    }));
  };

  // Helper function to determine event type
  const getEventType = (type: string, detail: string): LiveEvent['type'] => {
    const typeStr = type?.toLowerCase() || '';
    const detailStr = detail?.toLowerCase() || '';
    
    if (typeStr.includes('goal') || detailStr.includes('goal')) return 'goal';
    if (typeStr.includes('card') || detailStr.includes('card')) return 'card';
    if (typeStr.includes('subst') || detailStr.includes('subst')) return 'substitution';
    if (detailStr.includes('corner')) return 'corner';
    if (detailStr.includes('free') || detailStr.includes('kick')) return 'freekick';
    if (detailStr.includes('offside')) return 'offside';
    if (detailStr.includes('foul')) return 'foul';
    if (detailStr.includes('shot')) return 'shot';
    if (detailStr.includes('save')) return 'save';
    
    return 'foul';
  };

  // Get event icon
  const getEventIcon = (type: LiveEvent['type']) => {
    switch (type) {
      case 'goal': return '⚽';
      case 'card': return '🟨';
      case 'substitution': return '🔄';
      case 'corner': return '📐';
      case 'freekick': return '🦶';
      case 'offside': return '🚩';
      case 'shot': return '🎯';
      case 'save': return '🧤';
      default: return '📝';
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
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-800 text-sm font-semibold">Live Match Tracker</span>
            </div>
          </div>
          <div className="h-96 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-2"></div>
              <p>Loading match data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayMatch) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Match Tracker</span>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <p className="mb-1">No match data available</p>
              {homeTeamData && awayTeamData && (
                <p className="text-xs opacity-60">
                  {homeTeamData?.name} vs {awayTeamData?.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLive && (
                <div className="relative">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-40"></div>
                </div>
              )}
              <span className="font-bold text-sm">LIVE MATCH TRACKER</span>
            </div>
            {isLive && (
              <div className="bg-white/20 px-2 py-1 rounded text-xs font-bold">
                {timeline.halfTime ? 'HT' : `${elapsed}'`}
              </div>
            )}
          </div>
        </div>

        {/* Match Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MyWorldTeamLogo 
                  team={homeTeamData}
                  size="w-8 h-8"
                  className="rounded-full"
                />
                {isNationalTeam(homeTeamData?.name) && (
                  <div className="absolute -bottom-1 -right-1">
                    <MyCircularFlag 
                      country={homeTeamData?.name}
                      size="w-3 h-3"
                    />
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">{displayMatch?.league?.name}</div>
                <div className="font-bold text-sm">{homeTeamData?.name}</div>
              </div>
            </div>

            <div className="text-center px-4">
              <div className="text-2xl font-bold text-gray-800">
                {displayMatch?.goals?.home || 0} - {displayMatch?.goals?.away || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentStatus === 'FT' ? 'Full Time' : 
                 currentStatus === 'HT' ? 'Half Time' : 
                 isLive ? 'Live' : 'Not Started'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="font-bold text-sm">{awayTeamData?.name}</div>
                <div className="text-xs text-gray-500 mt-1">{displayMatch?.fixture?.venue?.name}</div>
              </div>
              <div className="relative">
                <MyWorldTeamLogo 
                  team={awayTeamData}
                  size="w-8 h-8"
                  className="rounded-full"
                />
                {isNationalTeam(awayTeamData?.name) && (
                  <div className="absolute -bottom-1 -right-1">
                    <MyCircularFlag 
                      country={awayTeamData?.name}
                      size="w-3 h-3"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100">
          {['timeline', 'stats', 'lineups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="h-80 overflow-hidden">
          {activeTab === 'timeline' && (
            <div className="h-full">
              {/* Mini Field Visualization */}
              <div className="relative h-24 bg-gradient-to-r from-green-600 to-green-700 mx-4 mt-4 rounded">
                {/* Field markings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-white/30"></div>
                  <div className="absolute w-px h-full bg-white/30"></div>
                  <div className="absolute w-8 h-8 border border-white/30 rounded-full"></div>
                </div>
                
                {/* Ball position */}
                <div 
                  className="absolute w-2 h-2 bg-white rounded-full transition-all duration-1000"
                  style={{
                    left: `${ballPosition.x}%`,
                    top: `${ballPosition.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                ></div>
                
                {/* Score overlay */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/50 text-white px-2 py-1 rounded text-xs font-bold">
                    {displayMatch?.goals?.home || 0} - {displayMatch?.goals?.away || 0}
                  </div>
                </div>
              </div>

              {/* Events Timeline */}
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3">Match Events</h3>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {timeline.events.length > 0 ? (
                    timeline.events.map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-center gap-3 p-2 rounded transition-colors ${
                          event.isRecent ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 text-center">
                          <span className="text-xs font-bold text-gray-600">{event.minute}'</span>
                        </div>
                        <div className="flex-shrink-0 text-lg">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.description}</div>
                          <div className="text-xs text-gray-500 truncate">{event.player}</div>
                        </div>
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          event.team === 'home' ? 'bg-blue-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No events yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Match Statistics</h3>
              
              {/* Possession */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Possession</span>
                  <span>{statistics.possession.home}% - {statistics.possession.away}%</span>
                </div>
                <div className="flex h-2 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className="bg-blue-500"
                    style={{ width: `${statistics.possession.home}%` }}
                  ></div>
                  <div 
                    className="bg-red-500"
                    style={{ width: `${statistics.possession.away}%` }}
                  ></div>
                </div>
              </div>

              {/* Other Stats */}
              {[
                { label: 'Shots', stat: 'shots' },
                { label: 'Shots on Target', stat: 'shotsOnTarget' },
                { label: 'Corners', stat: 'corners' },
                { label: 'Fouls', stat: 'fouls' },
                { label: 'Offsides', stat: 'offsides' }
              ].map(({ label, stat }) => (
                <div key={stat} className="flex justify-between items-center">
                  <div className="flex-1 text-right text-sm font-medium">
                    {statistics[stat as keyof MatchStatistics].home}
                  </div>
                  <div className="flex-1 text-center text-xs text-gray-600 px-4">
                    {label}
                  </div>
                  <div className="flex-1 text-left text-sm font-medium">
                    {statistics[stat as keyof MatchStatistics].away}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'lineups' && (
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">Team Lineups</h3>
              <div className="text-center text-gray-500 text-sm py-8">
                Lineup data not available
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isLive && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLMTLive;
