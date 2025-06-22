
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LiveEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface LiveActionWidgetProps {
  fixtureId: number;
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
  events?: LiveEvent[];
  status: {
    short: string;
    elapsed?: number;
  };
}

const LiveActionWidget: React.FC<LiveActionWidgetProps> = ({
  fixtureId,
  homeTeam,
  awayTeam,
  events = [],
  status
}) => {
  const [currentAction, setCurrentAction] = useState<string>('');
  const [actionTeam, setActionTeam] = useState<string>('');
  const [actionPlayer, setActionPlayer] = useState<string>('');
  const [timelinePosition, setTimelinePosition] = useState<number>(0);

  // Get the latest action from events
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0]; // Events are sorted by time (most recent first)
      
      // Map event types to action descriptions
      const actionMap: { [key: string]: string } = {
        'Goal': 'Goal',
        'Card': 'Card',
        'subst': 'Substitution',
        'Var': 'VAR Check',
        'Miss': 'Chance Missed',
        'Shot': 'Shot',
        'Corner': 'Corner',
        'Foul': 'Foul',
        'Offside': 'Offside'
      };

      const action = actionMap[latestEvent.type] || 'Action';
      setCurrentAction(`${action}`);
      setActionTeam(latestEvent.team.name);
      setActionPlayer(latestEvent.player.name);
    } else {
      // Default actions for live matches without specific events
      if (status.short === '1H') {
        setCurrentAction('Attacking');
        setActionTeam(Math.random() > 0.5 ? homeTeam.name : awayTeam.name);
      } else if (status.short === 'HT') {
        setCurrentAction('Half Time');
        setActionTeam('');
      } else if (status.short === '2H') {
        setCurrentAction('Attacking');
        setActionTeam(Math.random() > 0.5 ? homeTeam.name : awayTeam.name);
      }
    }
  }, [events, status, homeTeam.name, awayTeam.name]);

  // Update timeline position based on elapsed time
  useEffect(() => {
    if (status.elapsed) {
      // Calculate position (0-100%) based on 90 minutes + extra time
      const totalGameTime = 90;
      const position = Math.min((status.elapsed / totalGameTime) * 100, 100);
      setTimelinePosition(position);
    }
  }, [status.elapsed]);

  const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status.short);

  if (!isLive) {
    return null;
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-green-600 to-green-800 text-white overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-black/20">
          <Badge variant="secondary" className="bg-red-600 text-white font-semibold">
            Live Action
          </Badge>
          <div className="text-sm font-medium">
            {status.elapsed}'
          </div>
        </div>

        {/* Football Pitch Visualization */}
        <div className="relative h-48 bg-gradient-to-r from-green-600 via-green-500 to-green-600 overflow-hidden">
          {/* Pitch Lines */}
          <div className="absolute inset-0">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60"></div>
            
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Goal areas */}
            <div className="absolute left-0 top-1/2 w-8 h-20 border-2 border-white/60 border-l-0 transform -translate-y-1/2"></div>
            <div className="absolute right-0 top-1/2 w-8 h-20 border-2 border-white/60 border-r-0 transform -translate-y-1/2"></div>
            
            {/* Penalty areas */}
            <div className="absolute left-0 top-1/2 w-16 h-32 border-2 border-white/60 border-l-0 transform -translate-y-1/2"></div>
            <div className="absolute right-0 top-1/2 w-16 h-32 border-2 border-white/60 border-r-0 transform -translate-y-1/2"></div>
          </div>

          {/* Action Indicator */}
          {currentAction && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs font-semibold text-green-200">
                  {currentAction}
                </div>
                <div className="text-lg font-bold text-white">
                  {actionTeam}
                </div>
                {actionPlayer && (
                  <div className="text-xs text-gray-200">
                    {actionPlayer}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent animate-pulse"></div>
        </div>

        {/* Timeline */}
        <div className="p-4 bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium">1</span>
            </div>
            
            <div className="text-xs text-gray-300 font-medium">
              CORNERS
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">0</span>
              <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="relative h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000 ease-out"
              style={{ width: `${timelinePosition}%` }}
            ></div>
            
            {/* Time indicator dot */}
            <div 
              className="absolute top-1/2 w-3 h-3 bg-blue-400 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out"
              style={{ left: `${timelinePosition}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveActionWidget;
