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
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'corner' | 'offside' | 'foul';
  player: string;
  description: string;
  timestamp: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState({ home: 0, away: 0 });
  const [matchTime, setMatchTime] = useState(0);
  const [ballPossession, setBallPossession] = useState<'home' | 'away'>('home');

  // Check if match is live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

  // Fetch match data from RapidAPI
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
            const match = matchData[0];
            setMatchData(match);
            setCurrentScore({
              home: match.goals?.home || 0,
              away: match.goals?.away || 0
            });
            setMatchTime(match.fixture?.status?.elapsed || 0);
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

    // Poll for updates every 15 seconds during live matches
    const interval = setInterval(fetchMatchData, 15000);
    return () => clearInterval(interval);
  }, [matchId, isLive]);

  // Process events from RapidAPI
  const processEvents = (events: any[]) => {
    const processedEvents: LiveEvent[] = events
      .filter(event => event.time?.elapsed <= 90)
      .slice(-10) // Get last 10 events
      .map((event, index) => {
        const isHomeTeam = event.team?.id === matchData?.teams?.home?.id;

        let eventType: LiveEvent['type'] = 'foul';

        if (event.type === 'Goal') {
          eventType = 'goal';
        } else if (event.type === 'Card') {
          eventType = event.detail?.includes('Red') ? 'red_card' : 'yellow_card';
        } else if (event.type === 'subst') {
          eventType = 'substitution';
        } else if (event.detail?.includes('Corner')) {
          eventType = 'corner';
        } else if (event.detail?.includes('Offside')) {
          eventType = 'offside';
        }

        return {
          id: `event_${event.time?.elapsed}_${index}`,
          minute: event.time?.elapsed || 0,
          team: isHomeTeam ? 'home' : 'away',
          type: eventType,
          player: event.player?.name || 'Player',
          description: event.detail || event.type,
          timestamp: Date.now() - (index * 60000) // Simulate timestamps
        };
      })
      .reverse(); // Most recent first

    setLiveEvents(processedEvents);
  };

  // Simulate ball possession changes
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to change possession
        setBallPossession(prev => prev === 'home' ? 'away' : 'home');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getEventIcon = (type: LiveEvent['type']) => {
    const icons = {
      goal: "⚽",
      yellow_card: "🟨",
      red_card: "🟥",
      substitution: "🔄",
      corner: "📐",
      offside: "🚩",
      foul: "⚠️"
    };
    return icons[type] || "⚽";
  };

  const getTeamCode = (team: 'home' | 'away') => {
    if (team === 'home') {
      return homeTeam?.code || homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOME';
    }
    return awayTeam?.code || awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWAY';
  };

  const formatTime = (minutes: number) => {
    if (minutes > 90) return `90+${minutes - 90}'`;
    return `${minutes}'`;
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
        <CardContent className="flex items-center justify-center h-40">
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
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center">
            <p className="text-white text-sm mb-2 opacity-80">Match not live</p>
            <p className="text-xs text-white opacity-60">
              Check back when the match is live
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

      {/* Match Info Bar */}
      <div className="px-4 pb-3">
        <div className="bg-black/30 rounded-lg px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-white">
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
                {getTeamCode('home')}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{currentScore.home}</span>
                  <span className="text-white/60">-</span>
                  <span className="text-lg font-bold">{currentScore.away}</span>
                </div>
                <div className="text-xs text-white/80 mt-1">
                  {status === 'HT' ? 'HALFTIME' : formatTime(matchTime)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {getTeamCode('away')}
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
        </div>
      </div>

      {/* Ball Possession Indicator */}
      <div className="px-4 pb-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
          ballPossession === 'home' ? 'bg-blue-600/80' : 'bg-red-600/80'
        } text-white`}>
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Ball: {getTeamCode(ballPossession)}
        </div>
      </div>

      {/* Live Events */}
      <CardContent className="p-4 pt-0">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {liveEvents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/60 text-sm">No recent events</p>
            </div>
          ) : (
            liveEvents.map((event, index) => (
              <div
                key={event.id}
                className={`flex items-center gap-3 p-3 rounded-lg backdrop-blur-sm transition-all duration-300 ${
                  index === 0 ? 'bg-white/20 border border-white/30' : 'bg-white/10'
                } ${index === 0 ? 'animate-pulse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white ${
                  event.type === 'goal' 
                    ? 'bg-yellow-500' 
                    : event.team === 'home' 
                      ? 'bg-blue-500' 
                      : 'bg-red-500'
                }`}>
                  {getEventIcon(event.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <div className="text-sm font-medium">
                        {event.description}
                      </div>
                      <div className="text-xs opacity-80">
                        {event.player} • {getTeamCode(event.team)}
                      </div>
                    </div>
                    <div className="text-white/80 text-xs font-medium">
                      {formatTime(event.minute)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;