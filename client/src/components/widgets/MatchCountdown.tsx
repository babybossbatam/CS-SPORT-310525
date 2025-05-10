import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Bell, BellOff, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getTeamColor } from '@/lib/colorUtils';
import { formatDistanceToNow, isBefore, isWithinInterval, addHours, subHours } from 'date-fns';

interface MatchCountdownProps {
  matchId: number;
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
  league: {
    id: number;
    name: string;
    logo: string;
  };
  matchDate: string;
  matchVenue?: string;
  isStarred?: boolean;
  onToggleStar?: (matchId: number) => void;
  onSetReminder?: (matchId: number, reminderTime: number) => void;
}

const MatchCountdown: React.FC<MatchCountdownProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  league,
  matchDate,
  matchVenue,
  isStarred = false,
  onToggleStar,
  onSetReminder
}) => {
  const [countdown, setCountdown] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [hasReminder, setHasReminder] = useState<boolean>(false);
  const [isMatchSoon, setIsMatchSoon] = useState<boolean>(false);
  const { toast } = useToast();
  
  const matchDateTime = new Date(matchDate);
  
  // Calculate time left and update countdown
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = matchDateTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown('Match has started!');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      // Check if match is within 24 hours
      const isWithin24Hours = isWithinInterval(matchDateTime, {
        start: now,
        end: addHours(now, 24)
      });
      
      setIsMatchSoon(isWithin24Hours);
      
      // Calculate time components
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
      
      // Format readable countdown
      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [matchDate, matchDateTime]);
  
  // Get team colors for styling
  const homeTeamColor = getTeamColor(homeTeam.name);
  const awayTeamColor = getTeamColor(awayTeam.name);
  
  // Handle reminder toggle
  const handleToggleReminder = () => {
    if (hasReminder) {
      setHasReminder(false);
      toast({
        title: 'Reminder removed',
        description: `You won't be notified before ${homeTeam.name} vs ${awayTeam.name}`,
      });
    } else {
      setHasReminder(true);
      if (onSetReminder) {
        // Default to 30min before match
        onSetReminder(matchId, 30);
      }
      toast({
        title: 'Reminder set',
        description: `You'll be notified 30 min before the match starts`,
      });
    }
  };
  
  // Handle star toggle
  const handleToggleStar = () => {
    if (onToggleStar) {
      onToggleStar(matchId);
      toast({
        title: isStarred ? 'Match removed from favorites' : 'Match added to favorites',
        description: isStarred 
          ? `${homeTeam.name} vs ${awayTeam.name} removed from your favorites` 
          : `${homeTeam.name} vs ${awayTeam.name} added to your favorites`,
      });
    }
  };
  
  return (
    <Card className={`
      w-full overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg
      ${isMatchSoon ? 'border-yellow-400 bg-yellow-50' : ''}
    `}>
      <CardHeader className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={league.logo} alt={league.name} className="h-5 w-5" />
          <CardTitle className="text-sm font-medium">{league.name}</CardTitle>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleToggleReminder}
            className="text-white/80 hover:text-white"
          >
            {hasReminder ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          <button 
            onClick={handleToggleStar}
            className={`${isStarred ? 'text-yellow-400' : 'text-white/80 hover:text-white'}`}
          >
            <Star className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          {/* Teams */}
          <div className="flex w-full items-center justify-between mb-4">
            <div className="flex flex-col items-center w-1/3">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name} 
                className="h-12 w-12 mb-2"
                style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' }}
              />
              <span className="text-xs text-center font-medium">{homeTeam.name}</span>
            </div>
            
            <div className="flex flex-col items-center w-1/3">
              <div className="text-sm font-bold mb-1">VS</div>
              <div className={`
                text-xl font-bold px-4 py-2 rounded-lg ${isMatchSoon ? 'animate-pulse' : ''}
                ${isMatchSoon ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-700'}
              `}>
                {timeLeft.days > 0
                  ? `${timeLeft.days}d`
                  : timeLeft.hours > 0
                    ? `${timeLeft.hours}h ${timeLeft.minutes}m`
                    : `${timeLeft.minutes}m ${timeLeft.seconds}s`
                }
              </div>
            </div>
            
            <div className="flex flex-col items-center w-1/3">
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name} 
                className="h-12 w-12 mb-2"
                style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' }}
              />
              <span className="text-xs text-center font-medium">{awayTeam.name}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r" 
              style={{ 
                backgroundImage: `linear-gradient(to right, ${homeTeamColor}, ${awayTeamColor})`,
                width: '0%'
              }}
            ></div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{matchDateTime.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{matchDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MatchCountdown;