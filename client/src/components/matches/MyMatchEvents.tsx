
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageCircle, Target, AlertTriangle, CornerDownRight, Play, Pause } from 'lucide-react';

interface MatchEvent {
  id: number;
  time: string;
  type: 'goal' | 'card' | 'substitution' | 'corner' | 'offside' | 'foul' | 'shot' | 'save';
  player: string;
  team: 'home' | 'away';
  description: string;
  isImportant?: boolean;
  coordinates?: { x: number; y: number };
}

interface MyMatchEventsProps {
  match?: any;
  homeTeam?: string;
  awayTeam?: string;
  matchStatus?: string;
  matchId?: string;
  widgetType?: 'custom' | 'sportradar' | 'api-football';
  sportradarConfig?: {
    clientAlias: string;
    matchId: string;
  };
  apiFootballConfig?: {
    apiKey: string;
    fixtureId: string;
    theme?: string;
  };
}

const MyMatchEvents: React.FC<MyMatchEventsProps> = ({
  match,
  homeTeam,
  awayTeam,
  matchStatus,
  matchId,
  widgetType = 'custom',
  sportradarConfig,
  apiFootballConfig
}) => {
  const [activeTab, setActiveTab] = useState<'playByPlay' | 'timeline' | 'stats'>('playByPlay');
  const [isLive, setIsLive] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const sportradarWidgetRef = useRef<HTMLDivElement>(null);
  const apiFootballWidgetRef = useRef<HTMLDivElement>(null);

  // Extract team names and match info from match data
  const displayHomeTeam = match?.teams?.home?.name || homeTeam || "Home Team";
  const displayAwayTeam = match?.teams?.away?.name || awayTeam || "Away Team";
  const displayMatchStatus = match?.fixture?.status?.short || matchStatus || "NS";
  const homeScore = match?.goals?.home ?? 0;
  const awayScore = match?.goals?.away ?? 0;

  // Check if match is live
  useEffect(() => {
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'LIVE', 'LIV'];
    setIsLive(liveStatuses.includes(displayMatchStatus));
    setCurrentMinute(match?.fixture?.status?.elapsed || 0);
  }, [displayMatchStatus, match]);

  // Load Sportradar widget
  useEffect(() => {
    if (widgetType === 'sportradar' && sportradarConfig && sportradarWidgetRef.current) {
      // Load Sportradar widget script
      const loadSportradarWidget = () => {
        // Check if script already exists
        if (document.querySelector('script[src*="widgets.media.sportradar.com"]')) {
          // Script already loaded, initialize widget
          if (window.USW) {
            window.USW('addWidget', '#sr-widget', 'us.match.playByPlay', {
              border: false,
              matchId: parseInt(sportradarConfig.matchId)
            });
          }
          return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.type = 'application/javascript';
        script.src = `https://widgets.media.sportradar.com/${sportradarConfig.clientAlias}/widgetloader`;
        script.setAttribute('data-sr-language', 'en_us');
        script.async = true;
        
        script.onload = () => {
          // Initialize widget after script loads
          if (window.USW) {
            window.USW('addWidget', '#sr-widget', 'us.match.playByPlay', {
              border: false,
              matchId: parseInt(sportradarConfig.matchId)
            });
          }
        };

        document.head.appendChild(script);
      };

      loadSportradarWidget();
    }
  }, [widgetType, sportradarConfig]);

  // Load API-Football widget
  useEffect(() => {
    if (widgetType === 'api-football' && apiFootballConfig && apiFootballWidgetRef.current) {
      // Check if script already exists
      if (document.querySelector('script[src*="widgets.api-sports.io"]')) {
        return;
      }

      // Create and load the API-Football widget script
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://widgets.api-sports.io/2.0.3/widgets.js';
      document.head.appendChild(script);
    }
  }, [widgetType, apiFootballConfig]);

  // Convert match events from API to our format
  const convertApiEventsToMatchEvents = (apiEvents: any[]): MatchEvent[] => {
    if (!apiEvents || !Array.isArray(apiEvents)) return [];

    return apiEvents.map((event, index) => ({
      id: index + 1,
      time: `${event.time?.elapsed || 0}'${event.time?.extra ? `+${event.time.extra}` : ''}`,
      type: event.type === 'Goal' ? 'goal' : 
            event.type === 'Card' ? 'card' : 
            event.type === 'subst' ? 'substitution' : 
            event.detail === 'Corner' ? 'corner' :
            event.detail === 'Offside' ? 'offside' : 
            event.detail === 'Shot' ? 'shot' :
            event.detail === 'Save' ? 'save' : 'foul',
      player: event.player?.name || 'Unknown Player',
      team: event.team?.id === match?.teams?.home?.id ? 'home' : 'away',
      description: event.detail || event.type || 'Match event',
      isImportant: event.type === 'Goal' || (event.type === 'Card' && (event.detail === 'Red Card' || event.detail === 'Yellow Card')),
      coordinates: event.coordinates ? { x: event.coordinates.x, y: event.coordinates.y } : undefined
    }));
  };

  // Generate enhanced sample events for demonstration
  const generateEnhancedSampleEvents = (): MatchEvent[] => {
    if (!match) return [];
    
    const events: MatchEvent[] = [];
    
    // Add goal events
    for (let i = 0; i < homeScore; i++) {
      events.push({
        id: events.length + 1,
        time: `${Math.floor(Math.random() * 90) + 1}'`,
        type: 'goal',
        player: `${displayHomeTeam} Player ${i + 1}`,
        team: 'home',
        description: 'Goal',
        isImportant: true,
        coordinates: { x: Math.random() * 100, y: Math.random() * 100 }
      });
    }
    
    for (let i = 0; i < awayScore; i++) {
      events.push({
        id: events.length + 1,
        time: `${Math.floor(Math.random() * 90) + 1}'`,
        type: 'goal',
        player: `${displayAwayTeam} Player ${i + 1}`,
        team: 'away',
        description: 'Goal',
        isImportant: true,
        coordinates: { x: Math.random() * 100, y: Math.random() * 100 }
      });
    }

    // Add more realistic events for live matches
    if (isLive) {
      const liveEvents = [
        { type: 'shot', description: 'Shot on target', isImportant: false },
        { type: 'corner', description: 'Corner kick', isImportant: false },
        { type: 'foul', description: 'Foul', isImportant: false },
        { type: 'save', description: 'Great save', isImportant: true },
        { type: 'card', description: 'Yellow Card', isImportant: true }
      ];

      liveEvents.forEach((eventTemplate, index) => {
        events.push({
          id: events.length + 1,
          time: `${Math.min(currentMinute + Math.floor(Math.random() * 10), 90)}'`,
          type: eventTemplate.type as any,
          player: `${Math.random() > 0.5 ? displayHomeTeam : displayAwayTeam} Player`,
          team: Math.random() > 0.5 ? 'home' : 'away',
          description: eventTemplate.description,
          isImportant: eventTemplate.isImportant,
          coordinates: { x: Math.random() * 100, y: Math.random() * 100 }
        });
      });
    }
    
    return events.sort((a, b) => parseInt(a.time) - parseInt(b.time));
  };

  const finalEvents = match?.events ? convertApiEventsToMatchEvents(match.events) : generateEnhancedSampleEvents();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'card':
        return <div className="w-3 h-4 bg-yellow-400 rounded-sm border border-yellow-600" />;
      case 'substitution':
        return <CornerDownRight className="w-4 h-4 text-blue-600" />;
      case 'shot':
        return <div className="w-4 h-4 rounded-full bg-orange-500" />;
      case 'save':
        return <div className="w-4 h-4 rounded bg-purple-500" />;
      case 'corner':
        return <div className="w-4 h-4 bg-gray-600 transform rotate-45" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string, team: string) => {
    const baseColors = {
      goal: team === 'home' ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200',
      card: 'bg-yellow-50 border-yellow-200',
      substitution: 'bg-blue-50 border-blue-200',
      shot: 'bg-orange-50 border-orange-200',
      save: 'bg-purple-50 border-purple-200',
      corner: 'bg-gray-50 border-gray-200'
    };
    return baseColors[type as keyof typeof baseColors] || 'bg-gray-50 border-gray-200';
  };

  const PlayByPlayView = () => (
    <div className="space-y-2">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 font-semibold text-sm">LIVE - {currentMinute}'</span>
          </div>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-red-200 rounded hover:bg-red-50"
          >
            {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            Auto-scroll
          </button>
        </div>
      )}

      {/* Score display */}
      <div className="flex justify-center items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">
            {displayMatchStatus === 'FT' ? 'Full Time' : 
             displayMatchStatus === 'HT' ? 'Half Time' : 
             displayMatchStatus === 'NS' ? 'Not Started' : 
             displayMatchStatus === '1H' ? '1st Half' : 
             displayMatchStatus === '2H' ? '2nd Half' : 
             'Live'}
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {displayHomeTeam.substring(0, 3).toUpperCase()} {homeScore} - {awayScore} {displayAwayTeam.substring(0, 3).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Events timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {finalEvents.length > 0 ? (
          finalEvents.map((event, index) => (
            <div
              key={event.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-all hover:shadow-sm ${getEventColor(event.type, event.team)}`}
            >
              {/* Time */}
              <div className="flex-shrink-0 w-12 text-center">
                <div className="text-sm font-bold text-gray-900">{event.time}</div>
              </div>

              {/* Event icon */}
              <div className="flex-shrink-0 mt-1">
                {getEventIcon(event.type)}
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {event.description}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {event.player} ({event.team === 'home' ? displayHomeTeam : displayAwayTeam})
                    </div>
                  </div>
                  {event.isImportant && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No events to display</p>
            {isLive && <p className="text-xs mt-1">Waiting for live events...</p>}
          </div>
        )}
      </div>
    </div>
  );

  const TimelineView = () => (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {finalEvents.map((event, index) => (
          <div key={event.id} className="relative flex items-start gap-4 pb-4">
            {/* Timeline dot */}
            <div className={`relative z-10 w-3 h-3 rounded-full ${
              event.isImportant ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-gray-900">{event.time}</span>
                {getEventIcon(event.type)}
                <span className="text-sm font-medium">{event.description}</span>
              </div>
              <div className="text-xs text-gray-600">
                {event.player} - {event.team === 'home' ? displayHomeTeam : displayAwayTeam}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StatsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{homeScore}</div>
          <div className="text-sm text-gray-600">Goals</div>
          <div className="text-xs text-gray-500">{displayHomeTeam}</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-900">{awayScore}</div>
          <div className="text-sm text-gray-600">Goals</div>
          <div className="text-xs text-gray-500">{displayAwayTeam}</div>
        </div>
      </div>
      
      <div className="space-y-3">
        {['Shots', 'Corners', 'Fouls', 'Cards'].map((stat, index) => (
          <div key={stat} className="flex justify-between items-center p-2 border rounded">
            <span className="text-sm font-medium">{stat}</span>
            <div className="flex gap-4">
              <span className="text-sm">{Math.floor(Math.random() * 10)}</span>
              <span className="text-sm">{Math.floor(Math.random() * 10)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Sportradar Widget View
  const SportradarWidgetView = () => (
    <div className="w-full min-h-96">
      <div 
        id="sr-widget"
        ref={sportradarWidgetRef}
        className="w-full h-full"
      >
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
            <p>Loading Sportradar widget...</p>
          </div>
        </div>
      </div>
    </div>
  );

  // API-Football Widget View
  const ApiFootballWidgetView = () => (
    <div className="w-full min-h-96">
      <div 
        id="wg-api-football-game"
        ref={apiFootballWidgetRef}
        data-host="v3.football.api-sports.io"
        data-key={apiFootballConfig?.apiKey || ""}
        data-id={apiFootballConfig?.fixtureId || ""}
        data-theme={apiFootballConfig?.theme || ""}
        data-refresh="15"
        data-show-errors="false"
        data-show-logos="true"
        className="w-full h-full"
      >
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
            <p>Loading API-Football widget...</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sr-widget w-full">
      <Card className="w-full shadow-lg border-gray-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
              Live Match Events
              {isLive && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Tab Navigation - Only show for custom widget */}
          {widgetType === 'custom' && (
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('playByPlay')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'playByPlay' 
                    ? 'border-blue-500 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Play by Play
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'timeline' 
                    ? 'border-blue-500 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'stats' 
                    ? 'border-blue-500 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stats
              </button>
            </div>
          )}

          {/* Content */}
          <div className={widgetType === 'custom' ? "p-4" : "p-0"}>
            {widgetType === 'custom' && (
              <>
                {activeTab === 'playByPlay' && <PlayByPlayView />}
                {activeTab === 'timeline' && <TimelineView />}
                {activeTab === 'stats' && <StatsView />}
              </>
            )}
            {widgetType === 'sportradar' && <SportradarWidgetView />}
            {widgetType === 'api-football' && <ApiFootballWidgetView />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyMatchEvents;
