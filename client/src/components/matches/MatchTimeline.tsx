import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Award, Flag, Shield, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types for match events
interface MatchEvent {
  id: number;
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'var' | 'break';
  team: 'home' | 'away';
  player?: string;
  detail?: string;
  assistedBy?: string;
}

interface MatchTimelineProps {
  events: MatchEvent[];
  currentMinute: number;
  totalMinutes: number;
  isLive: boolean;
}

const MatchTimeline: React.FC<MatchTimelineProps> = ({ 
  events = [], 
  currentMinute = 0, 
  totalMinutes = 90,
  isLive = false
}) => {
  const [timelineProgress, setTimelineProgress] = useState(0);
  
  // Animate progress based on current match minute
  useEffect(() => {
    if (currentMinute > 0) {
      const progress = Math.min(100, (currentMinute / totalMinutes) * 100);
      setTimelineProgress(progress);
    } else {
      setTimelineProgress(0);
    }
  }, [currentMinute, totalMinutes]);
  
  // Animation values for live indicator
  const liveAnimationVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      }
    },
    static: { scale: 1 }
  };
  
  // Get icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Award className="h-3 w-3" />;
      case 'card':
        return <div className="h-3 w-2 bg-yellow-400 rounded-sm"></div>;
      case 'substitution':
        return <User className="h-3 w-3" />;
      case 'var':
        return <div className="h-3 w-3 text-blue-500">VAR</div>;
      case 'break':
        return <Shield className="h-3 w-3" />;
      default:
        return <Flag className="h-3 w-3" />;
    }
  };
  
  // Get event dot color
  const getEventColor = (type: string, team: string) => {
    switch (type) {
      case 'goal': 
        return team === 'home' ? 'bg-blue-500' : 'bg-red-500';
      case 'card':
        return 'bg-yellow-400';
      case 'substitution':
        return 'bg-green-500';
      case 'var':
        return 'bg-purple-500';
      case 'break':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <div className="w-full px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-sm font-medium">
            {currentMinute > 0 ? `${currentMinute}'` : 'Not started'}
          </span>
        </div>
        
        {isLive && (
          <motion.div 
            variants={liveAnimationVariants}
            animate="pulse"
            className="flex items-center bg-red-100 px-2 py-0.5 rounded-full"
          >
            <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs font-medium text-red-500">LIVE</span>
          </motion.div>
        )}
      </div>
      
      {/* Timeline track */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-in-out"
          style={{ width: `${timelineProgress}%` }}
        ></div>
      </div>
      
      {/* Timeline periods */}
      <div className="flex w-full justify-between text-xs text-gray-500 mb-2">
        <span>0'</span>
        <span>45'</span>
        <span>90'</span>
      </div>
      
      {/* Timeline events */}
      <div className="relative h-12 w-full">
        {events.map((event) => (
          <TooltipProvider key={event.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`absolute h-4 w-4 ${getEventColor(event.type, event.team)} rounded-full flex items-center justify-center`}
                  style={{ 
                    left: `${(event.minute / totalMinutes) * 100}%`, 
                    top: event.team === 'home' ? '0' : '8px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {getEventIcon(event.type)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs p-2 max-w-[200px]">
                <p><b>{event.minute}'</b> - {event.player || 'Event'}</p>
                {event.detail && <p>{event.detail}</p>}
                {event.assistedBy && <p><i>Assisted by: {event.assistedBy}</i></p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default MatchTimeline;