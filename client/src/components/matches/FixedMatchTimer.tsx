import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

interface FixedMatchTimerProps {
  matchDate: string;
}

// This is a simplified countdown timer that only shows for matches within 8 hours
const FixedMatchTimer = ({ matchDate }: FixedMatchTimerProps) => {
  const [timer, setTimer] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // This timer simulates a countdown for a match at 3:00am when current time is 18:00 (6pm)
  useEffect(() => {
    const updateTimer = () => {
      try {
        const targetDate = parseISO(matchDate);
        
        // Use current real time instead of fixed time
        const now = new Date();
        
        // Get real seconds for the ticking effect
        const currentSeconds = new Date().getSeconds();
        now.setSeconds(currentSeconds);
        
        // Calculate time difference
        const msToMatch = targetDate.getTime() - now.getTime();
        
        // Calculate hours to match - for display decisions
        const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));
        
        // Only show countdown if less than 8 hours away (not equal to 8)
        if (hoursToMatch >= 8 || hoursToMatch < 0) {
          return;
        }
        
        // Calculate each time component
        const hours = Math.floor(msToMatch / (1000 * 60 * 60));
        const minutes = Math.floor((msToMatch % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msToMatch % (1000 * 60)) / 1000);
        
        setTimer({ hours, minutes, seconds });
      } catch (e) {
        console.error('Timer calculation error:', e);
      }
    };
    
    // Initial update
    updateTimer();
    
    // Set interval for updates
    const interval = setInterval(updateTimer, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [matchDate]);
  
  // Format timer with leading zeros
  const formattedHours = timer.hours.toString().padStart(2, '0');
  const formattedMinutes = timer.minutes.toString().padStart(2, '0');
  const formattedSeconds = timer.seconds.toString().padStart(2, '0');
  
  return (
    <span style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{formattedHours}:{formattedMinutes}:{formattedSeconds}</span>
  );
};

export default FixedMatchTimer;