import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, AlertTriangle, User, CornerDownRight, Goal, ShieldAlert } from 'lucide-react';
import AnimatedTeamLogo from './AnimatedTeamLogo';

// Define match event types
export interface MatchEvent {
  id: number;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'var' | 'chance';
  team: 'home' | 'away';
  player: string;
  detail?: string;
  assistedBy?: string;
  isHome?: boolean; // If the event is for the home team
}

interface MatchTimelineProps {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  events: MatchEvent[];
  matchStatus: string;
  currentMinute?: number;
}

const MatchTimeline: React.FC<MatchTimelineProps> = ({
  homeTeam,
  awayTeam,
  events,
  matchStatus,
  currentMinute = 0
}) => {
  const [selectedEvent, setSelectedEvent] = useState<MatchEvent | null>(null);

  // Sort events by minute
  const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

  // Get the event icon based on the type
  const getEventIcon = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal':
        return <Goal className="w-4 h-4 text-green-600" />;
      case 'yellow_card':
        return <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>;
      case 'red_card':
        return <div className="w-3 h-4 bg-red-600 rounded-sm"></div>;
      case 'substitution':
        return <CornerDownRight className="w-4 h-4 text-blue-500" />;
      case 'penalty':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'var':
        return <ShieldAlert className="w-4 h-4 text-purple-500" />;
      case 'chance':
        return <Goal className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get the event color based on the type
  const getEventColor = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal':
        return 'bg-green-600';
      case 'yellow_card':
        return 'bg-yellow-400';
      case 'red_card':
        return 'bg-red-600';
      case 'substitution':
        return 'bg-blue-500';
      case 'penalty':
        return 'bg-orange-500';
      case 'var':
        return 'bg-purple-500';
      case 'chance':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  // Event detail text based on the type
  const getEventText = (event: MatchEvent) => {
    switch (event.type) {
      case 'goal':
        return `${event.player} scores${event.assistedBy ? ` (assist: ${event.assistedBy})` : ''}`;
      case 'yellow_card':
        return `${event.player} receives a yellow card`;
      case 'red_card':
        return `${event.player} receives a red card`;
      case 'substitution':
        return `${event.player} replaces ${event.detail || 'a player'}`;
      case 'penalty':
        return `Penalty awarded to ${event.player}`;
      case 'var':
        return `VAR Review: ${event.detail}`;
      case 'chance':
        return `Chance for ${event.player}`;
      default:
        return event.detail || '';
    }
  };

  return (
    <Card className="my-4">
      <CardHeader className="p-4 border-b flex items-center font-semibold">
        <Clock className="mr-2 h-5 w-5 text-blue-600" />
        Match Timeline
      </CardHeader>
      <CardContent className="p-4">
        {/* Timeline scale */}
        <div className="relative h-10 mb-4 flex items-center">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-200 w-full rounded-full"></div>
          
          {/* First half */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-500 rounded-l-full" 
            style={{ width: '45%' }}></div>
          
          {/* Half time */}
          <div className="absolute left-[45%] top-1/2 transform -translate-y-1/2 h-4 w-1 bg-gray-400"></div>
          
          {/* Second half */}
          <div className="absolute left-[46%] top-1/2 transform -translate-y-1/2 h-1 bg-red-500" 
            style={{ width: currentMinute > 45 ? `${Math.min((currentMinute - 45) / 45 * 54, 54)}%` : '0%' }}></div>
          
          {/* Timeline markers */}
          <div className="absolute w-full flex justify-between text-xs text-gray-500 top-4">
            <span className="text-center relative -left-1">0'</span>
            <span className="text-center">15'</span>
            <span className="text-center">30'</span>
            <span className="text-center relative left-1">45'</span>
            <span className="text-center">60'</span>
            <span className="text-center">75'</span>
            <span className="text-center relative -right-1">90'</span>
          </div>
          
          {/* Current minute indicator (for live matches) */}
          {matchStatus === 'In Play' && (
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 h-4 w-4 bg-red-600 rounded-full shadow-lg animate-pulse"
              style={{ left: `${Math.min((currentMinute / 90) * 100, 100)}%` }}
            ></div>
          )}
        </div>
        
        {/* Timeline events */}
        <div className="relative mt-8 mb-10 pl-12 pr-12">
          <div className="absolute h-0.5 bg-gray-200 w-full top-3 left-0"></div>
          
          {sortedEvents.map((event) => (
            <div 
              key={event.id}
              className={`absolute cursor-pointer group ${event.team === 'home' ? '-translate-y-full -top-2' : 'top-4'}`}
              style={{ left: `${(event.minute / 90) * 100}%` }}
              onClick={() => setSelectedEvent(event)}
            >
              <div className={`flex flex-col items-center ${event.team === 'home' ? 'mb-1' : 'mt-1'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${event.team === 'home' ? 'order-1' : 'order-2'} ${getEventColor(event.type)} bg-opacity-20 border border-current`}>
                  {getEventIcon(event.type)}
                </div>
                <div className={`text-xs font-semibold ${event.team === 'home' ? 'order-2' : 'order-1'}`}>
                  {event.minute}'
                </div>
              </div>
              
              <div className={`absolute opacity-0 group-hover:opacity-100 ${event.team === 'home' ? '-top-14' : 'top-12'} -left-20 bg-white shadow-lg rounded-md p-2 text-xs w-40 z-10 transition-opacity duration-200`}>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3">
                    {event.team === 'home' 
                      ? <img src={homeTeam.logo} alt={homeTeam.name} className="w-full h-full object-contain" /> 
                      : <img src={awayTeam.logo} alt={awayTeam.name} className="w-full h-full object-contain" />
                    }
                  </div>
                  <span className="font-semibold">{event.minute}' {event.team === 'home' ? homeTeam.name : awayTeam.name}</span>
                </div>
                <div className="text-gray-700">{getEventText(event)}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Event details panel */}
        {selectedEvent && (
          <div className="mt-4 p-3 border rounded-md bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white shadow-sm">
                  {selectedEvent.team === 'home' 
                    ? <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5 object-contain" /> 
                    : <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5 object-contain" />
                  }
                </div>
                <div>
                  <div className="text-sm font-semibold">{selectedEvent.minute}' - {selectedEvent.team === 'home' ? homeTeam.name : awayTeam.name}</div>
                  <div className="text-sm text-gray-700">{getEventText(selectedEvent)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {getEventIcon(selectedEvent.type)}
                <span className="text-xs text-gray-500 capitalize">{selectedEvent.type.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Event filter buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold pr-2">Filter:</div>
          <button className="text-xs px-2 py-1 rounded-full bg-green-600 bg-opacity-20 text-green-800 flex items-center gap-1 border border-green-400">
            <Goal className="w-3 h-3" />
            Goals
          </button>
          <button className="text-xs px-2 py-1 rounded-full bg-yellow-600 bg-opacity-20 text-yellow-800 flex items-center gap-1 border border-yellow-400">
            <div className="w-2 h-3 bg-yellow-400"></div>
            Cards
          </button>
          <button className="text-xs px-2 py-1 rounded-full bg-blue-600 bg-opacity-20 text-blue-800 flex items-center gap-1 border border-blue-400">
            <CornerDownRight className="w-3 h-3" />
            Substitutions
          </button>
          <button className="text-xs px-2 py-1 rounded-full bg-gray-600 bg-opacity-20 text-gray-800 flex items-center gap-1 border border-gray-400">
            All Events
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchTimeline;