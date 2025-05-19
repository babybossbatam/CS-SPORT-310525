import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

interface CountdownTimerProps {
  matchDate: string;
}

const CountdownTimer = ({ matchDate }: CountdownTimerProps) => {
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    // Function to update the countdown
    const updateCountdown = () => {
      try {
        const targetDate = parseISO(matchDate);
        // Fixed reference time for demo purposes
        const now = new Date("2025-05-19T12:00:00Z");
        
        // Add current seconds to simulate time passing
        const currentSeconds = Math.floor(Date.now() / 1000) % 60;
        now.setSeconds(now.getSeconds() + currentSeconds);
        
        const msToMatch = targetDate.getTime() - now.getTime();
        
        // Don't show negative times
        if (msToMatch <= 0) {
          setCountdown({ hours: 0, minutes: 0, seconds: 0 });
          return;
        }
        
        // Calculate time components
        const hours = Math.floor(msToMatch / (1000 * 60 * 60));
        const minutes = Math.floor((msToMatch % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msToMatch % (1000 * 60)) / 1000);
        
        setCountdown({ hours, minutes, seconds });
      } catch (e) {
        console.error('Error updating countdown:', e);
      }
    };
    
    // Update immediately
    updateCountdown();
    
    // Set up interval to update every second
    const interval = setInterval(updateCountdown, 1000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [matchDate]);
  
  // Format with leading zeros
  const formattedHours = countdown.hours.toString().padStart(2, '0');
  const formattedMinutes = countdown.minutes.toString().padStart(2, '0');
  const formattedSeconds = countdown.seconds.toString().padStart(2, '0');
  
  return (
    <span className="font-mono">{formattedHours}:{formattedMinutes}:{formattedSeconds}</span>
  );
};

export default CountdownTimer;