import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

interface MatchCountdownTimerProps {
  matchDate: string;
}

/**
 * A dedicated countdown timer component that shows the time remaining until a match
 * For matches within 8 hours of start time
 */
const MatchCountdownTimer = ({ matchDate }: MatchCountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('Loading...');
  
  useEffect(() => {
    // Calculate initial time
    updateTimer();
    
    // Set interval to update every second
    const interval = setInterval(updateTimer, 1000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
    
    function updateTimer() {
      try {
        const targetDate = parseISO(matchDate);
        
        // For demo, use a fixed current date
        const now = new Date("2025-05-19T12:00:00Z");
        
        // Simulate seconds passing in demo time
        const secondsPassed = Math.floor(Date.now() / 1000) % 60;
        now.setSeconds(now.getSeconds() + secondsPassed);
        
        const diff = targetDate.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('Starting now');
          return;
        }
        
        // Calculate time components
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Format with leading zeros
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        setTimeRemaining(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
      } catch (error) {
        console.error('Error calculating countdown:', error);
        setTimeRemaining('--:--:--');
      }
    }
  }, [matchDate]);
  
  return (
    <div className="font-mono tabular-nums text-center inline-block h-[20px] leading-[20px] min-w-[80px] whitespace-nowrap">
      {timeRemaining}
    </div>
  );
};

export default MatchCountdownTimer;