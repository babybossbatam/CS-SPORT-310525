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

interface PlayByPlayEvent {
  id: string;
  minute: number;
  team: 'home' | 'away';
  type: 'goal' | 'substitution' | 'card' | 'corner' | 'freekick' | 'offside' | 'foul' | 'shot' | 'save' | 'attempt';
  player: string;
  description: string;
  timestamp: number;
  isRecent?: boolean;
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
            generatePlayByPlayEvents(liveMatch);
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
            generatePlayByPlayEvents(match);
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

            // Generate new events if time has progressed
            if (currentElapsed > previousElapsed) {
              generatePlayByPlayEvents(currentMatch, true);
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
          // Set up real-time updates every 10 seconds (like 365scores)
          updateInterval = setInterval(fetchLiveUpdates, 10000);
          console.log(`🔄 [Live Action] Started real-time updates for match ${matchId}`);
        }
      }
    });

    return () => {
      mounted = false;
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [matchId]);

  const generatePlayByPlayEvents = (matchData: any, isUpdate: boolean = false) => {
    const homeTeam = matchData.teams?.home;
    const awayTeam = matchData.teams?.away;
    const elapsed = matchData.fixture?.status?.elapsed || 0;

    // 365scores-style event types with realistic probabilities
    const eventTypes = [
      { type: 'shot', weight: 0.4, descriptions: ['Shot blocked', 'Shot saved', 'Shot wide', 'Shot on target'] },
      { type: 'attempt', weight: 0.25, descriptions: ['Attempt blocked', 'Attempt saved', 'Dangerous attack'] },
      { type: 'foul', weight: 0.15, descriptions: ['Foul', 'Free kick awarded', 'Handball'] },
      { type: 'corner', weight: 0.08, descriptions: ['Corner kick'] },
      { type: 'offside', weight: 0.05, descriptions: ['Offside'] },
      { type: 'card', weight: 0.04, descriptions: ['Yellow card', 'Caution'] },
      { type: 'substitution', weight: 0.02, descriptions: ['Substitution'] },
      { type: 'goal', weight: 0.01, descriptions: ['GOAL!', 'Goal scored!'] }
    ];

    const players = {
      home: ['Player', 'Forward', 'Midfielder', 'Defender'],
      away: ['Player', 'Forward', 'Midfielder', 'Defender']
    };

    const events: PlayByPlayEvent[] = [];

    // Generate 2-4 recent events
    const numEvents = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numEvents; i++) {
      const isHomeTeam = Math.random() > 0.5;
      const team = isHomeTeam ? 'home' : 'away';
      const teamPlayers = players[team];
      const player = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];

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

      const eventMinute = Math.max(1, elapsed - Math.floor(Math.random() * 5));
      const description = selectedEvent.descriptions[Math.floor(Math.random() * selectedEvent.descriptions.length)];

      events.push({
        id: `event_${Date.now()}_${i}`,
        minute: eventMinute,
        team,
        type: selectedEvent.type as any,
        player,
        description,
        timestamp: Date.now() - (i * 15000),
        isRecent: i === 0 && isUpdate
      });
    }

    // Sort by most recent first (365scores style)
    events.sort((a, b) => b.timestamp - a.timestamp);

    if (isUpdate) {
      // Add new events to the beginning
      setPlayByPlayEvents(prev => [...events, ...prev.slice(0, 8)]);
    } else {
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
      attempt: "🎯",
      save: "🥅"
    };
    return icons[type as keyof typeof icons] || "⚽";
  };

  const getTeamDisplayName = (team: 'home' | 'away') => {
    if (team === 'home') {
      return homeTeam?.code || awayTeam?.name?.substring(0, 3).toUpperCase() || 'HOME';
    }
    return awayTeam?.code || awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWAY';
  };

  // Use fetched live data
  const displayMatch = liveData;
  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;
  const statusData = status || displayMatch?.fixture?.status?.short;

  // Determine if match is currently live
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive = currentStatus && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  if (isLoading) {
    return (
      <Card className={`w-full ${className} bg-white border border-gray-200`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-pulse text-gray-500 text-sm">Loading...</div>
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
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">
            {matchId ? `No match data found for ID: ${matchId}` : 'No match selected'}
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
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">Match not live</p>
            <p className="text-xs text-gray-400">
              {homeTeamData?.name} vs {awayTeamData?.name}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className} bg-white border border-gray-200`}>
      {/* Header - 365scores style */}
      <CardHeader className="pb-2 px-3 py-2 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700">Live Action</span>
          </div>
          <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse">
            LIVE
          </Badge>
        </div>
      </CardHeader>

      {/* Match Score - 365scores compact style */}
      <CardContent className="px-3 py-2 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <img 
              src={homeTeamData?.logo} 
              alt={homeTeamData?.name} 
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.src = "/assets/fallback-logo.png";
              }}
            />
            <span className="text-xs font-medium text-gray-800 truncate">
              {homeTeamData?.name?.length > 12 
                ? homeTeamData?.name?.substring(0, 12) + '...' 
                : homeTeamData?.name
              }
            </span>
          </div>

          <div className="flex items-center gap-3 px-3">
            <div className="text-center">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="text-blue-600">{displayMatch?.goals?.home || 0}</span>
                <span className="text-xs text-gray-400">-</span>
                <span className="text-red-500">{displayMatch?.goals?.away || 0}</span>
              </div>
              <div className="text-xs text-green-600 font-medium">
                {elapsed}'
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-xs font-medium text-gray-800 truncate">
              {awayTeamData?.name?.length > 12 
                ? awayTeamData?.name?.substring(0, 12) + '...' 
                : awayTeamData?.name
              }
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
      </CardContent>

      {/* Play-by-Play Events - 365scores timeline style */}
      <CardContent className="p-0 max-h-64 overflow-y-auto">
        {playByPlayEvents.length > 0 ? (
          <div className="space-y-0">
            {playByPlayEvents.map((event, index) => (
              <div 
                key={`${event.id}-${event.timestamp}-${index}`} 
                className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-xs ${
                  event.isRecent ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                {/* Time */}
                <div className="w-8 text-green-600 font-bold text-xs">
                  {event.minute}'
                </div>

                {/* Event Icon */}
                <div className="w-4 text-center">
                  {getEventIcon(event.type)}
                </div>

                {/* Event Description */}
                <div className="flex-1 text-gray-800 font-medium">
                  {event.description}
                </div>

                {/* Team Badge */}
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                  event.team === 'home' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {getTeamDisplayName(event.team)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-6 text-center text-gray-500 text-xs">
            <div className="animate-pulse">Loading live events...</div>
          </div>
        )}
      </CardContent>

      {/* Footer - Last update timestamp */}
      <CardContent className="px-3 py-1 bg-gray-50 border-t">
        <div className="text-xs text-gray-500 text-center">
          Last update: {lastUpdate}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;