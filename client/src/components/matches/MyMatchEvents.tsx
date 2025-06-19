
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageCircle, Target, AlertTriangle, CornerDownRight } from 'lucide-react';

interface MatchEvent {
  id: number;
  time: string;
  type: 'goal' | 'card' | 'substitution' | 'corner' | 'offside' | 'foul';
  player: string;
  team: 'home' | 'away';
  description: string;
  isImportant?: boolean;
}

interface MyMatchEventsProps {
  match?: any;
  homeTeam?: string;
  awayTeam?: string;
  matchStatus?: string;
}

const MyMatchEvents: React.FC<MyMatchEventsProps> = ({
  match,
  homeTeam,
  awayTeam,
  matchStatus
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'commentary'>('top');

  // Extract team names and match info from match data
  const displayHomeTeam = match?.teams?.home?.name || homeTeam || "Home Team";
  const displayAwayTeam = match?.teams?.away?.name || awayTeam || "Away Team";
  const displayMatchStatus = match?.fixture?.status?.short || matchStatus || "NS";
  const homeScore = match?.goals?.home ?? 0;
  const awayScore = match?.goals?.away ?? 0;

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
            event.detail === 'Offside' ? 'offside' : 'foul',
      player: event.player?.name || 'Unknown Player',
      team: event.team?.id === match?.teams?.home?.id ? 'home' : 'away',
      description: event.detail || event.type || 'Match event',
      isImportant: event.type === 'Goal' || (event.type === 'Card' && (event.detail === 'Red Card' || event.detail === 'Yellow Card'))
    }));
  };

  // Use real match events from the selected match
  const matchEvents = match?.events ? convertApiEventsToMatchEvents(match.events) : [];

  // Generate more realistic sample events based on actual match data
  const generateSampleEvents = (): MatchEvent[] => {
    if (!match) return [];
    
    const events: MatchEvent[] = [];
    const homeScore = match.goals?.home || 0;
    const awayScore = match.goals?.away || 0;
    
    // Add goal events based on actual score
    for (let i = 0; i < homeScore; i++) {
      events.push({
        id: events.length + 1,
        time: `${Math.floor(Math.random() * 90) + 1}'`,
        type: 'goal',
        player: `${displayHomeTeam} Player ${i + 1}`,
        team: 'home',
        description: 'Goal',
        isImportant: true
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
        isImportant: true
      });
    }
    
    // Add some cards if it's a finished match
    if (displayMatchStatus === 'FT') {
      events.push({
        id: events.length + 1,
        time: `${Math.floor(Math.random() * 90) + 1}'`,
        type: 'card',
        player: `${Math.random() > 0.5 ? displayHomeTeam : displayAwayTeam} Player`,
        team: Math.random() > 0.5 ? 'home' : 'away',
        description: 'Yellow Card',
        isImportant: true
      });
    }
    
    // Sort by time
    return events.sort((a, b) => parseInt(a.time) - parseInt(b.time));
  };

  // Use real events if available, otherwise generate sample based on match data
  const finalEvents = matchEvents.length > 0 ? matchEvents : generateSampleEvents();

  // Generate commentary events from match events
  const generateCommentaryEvents = () => {
    if (finalEvents.length > 0) {
      return finalEvents
        .filter(event => event.isImportant)
        .map(event => ({
          time: event.time,
          score: event.type === 'goal' ? `${homeScore}-${awayScore}` : "",
          description: `${event.player} (${event.team === 'home' ? displayHomeTeam : displayAwayTeam}) ${event.description}`
        }));
    }

    // Fallback commentary for matches without events
    if (displayMatchStatus === 'NS') {
      return [
        {
          time: "Pre-match",
          score: "",
          description: `Match between ${displayHomeTeam} and ${displayAwayTeam} has not started yet.`
        }
      ];
    }

    return [
      {
        time: displayMatchStatus === 'FT' ? "90'" : "Live",
        score: `${homeScore}-${awayScore}`,
        description: displayMatchStatus === 'FT' 
          ? `Match ended between ${displayHomeTeam} and ${displayAwayTeam}.`
          : `Match is ongoing between ${displayHomeTeam} and ${displayAwayTeam}.`
      }
    ];
  };

  const commentaryEvents = generateCommentaryEvents();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'card':
        return <div className="w-3 h-4 bg-yellow-400 rounded-sm" />;
      case 'substitution':
        return <CornerDownRight className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPlayerAvatar = (playerName: string) => {
    // Generate a simple avatar with initials
    const initials = playerName.split(' ').map(n => n[0]).join('').toUpperCase();
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
        {initials}
      </div>
    );
  };

  const filteredEvents = activeTab === 'top' 
    ? finalEvents.filter(event => event.isImportant)
    : finalEvents;

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
          Match Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'top' 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setActiveTab('commentary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'commentary' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Commentary
          </button>
        </div>

        {/* Match Score Header */}
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">
            {displayMatchStatus === 'FT' ? 'Full Time' : 
             displayMatchStatus === 'HT' ? 'Half Time' : 
             displayMatchStatus === 'NS' ? 'Not Started' : 
             displayMatchStatus === '1H' ? '1st Half' : 
             displayMatchStatus === '2H' ? '2nd Half' : 
             'Match Status'}
          </span>
          <span className="text-lg font-bold">{homeScore} - {awayScore}</span>
        </div>

        {/* Events List */}
        {activeTab === 'commentary' ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <h3 className="font-semibold text-gray-900 mb-2">Commentary</h3>
            </div>
            {commentaryEvents.map((event, index) => (
              <div key={index} className="flex gap-3 p-3 border-l-2 border-gray-200">
                <div className="text-sm font-medium text-gray-600 min-w-[40px]">
                  {event.time}
                </div>
                <div className="flex-1">
                  {event.score && (
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      {event.score}
                    </div>
                  )}
                  <div className="text-sm text-gray-700">
                    {event.description}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                See All →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              // Calculate score at this point in time for each event
              const eventsUpToThis = finalEvents.slice(0, finalEvents.findIndex(e => e.id === event.id) + 1);
              const goalsUpToThis = eventsUpToThis.filter(e => e.type === 'goal');
              const homeGoalsAtTime = goalsUpToThis.filter(e => e.team === 'home').length;
              const awayGoalsAtTime = goalsUpToThis.filter(e => e.team === 'away').length;
              
              return (
                <div key={event.id} className="flex gap-4 py-3 border-b border-gray-100 last:border-b-0">
                  {/* Time column */}
                  <div className="text-sm font-medium text-gray-600 min-w-[40px] pt-1">
                    {event.time}
                  </div>
                  
                  {/* Score and description column */}
                  <div className="flex-1">
                    {/* Score */}
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {homeGoalsAtTime}-{awayGoalsAtTime}
                    </div>
                    
                    {/* Event description */}
                    <div className="text-sm text-gray-700">
                      {event.player} ({event.team === 'home' ? displayHomeTeam : displayAwayTeam}) {event.description}
                    </div>
                  </div>
                  
                  {/* Event icon */}
                  <div className="flex items-start pt-1">
                    {getEventIcon(event.type)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredEvents.length === 0 && activeTab !== 'commentary' && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No events to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMatchEvents;
