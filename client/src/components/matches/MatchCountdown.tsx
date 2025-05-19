import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

interface MatchCountdownProps {
  matchDate: string;
}

const MatchCountdown = ({ matchDate }: MatchCountdownProps) => {
  const [timeDisplay, setTimeDisplay] = useState<string>('Loading...');

  useEffect(() => {
    try {
      const targetDate = parseISO(matchDate);
      
      // Initial calculation
      calculateTimeRemaining(targetDate);
      
      // Update every second
      const interval = setInterval(() => {
        calculateTimeRemaining(targetDate);
      }, 1000);
      
      return () => clearInterval(interval);
    } catch (e) {
      setTimeDisplay('Time unavailable');
    }
  }, [matchDate]);
  
  const calculateTimeRemaining = (targetDate: Date) => {
    // For demo purposes, use a fixed current date
    // Use a new Date object each time to simulate time passing
    const now = new Date("2025-05-19T12:00:00Z");
    // Simulate the current timer by adding seconds based on component render time
    now.setSeconds(now.getSeconds() + Math.floor((Date.now() / 1000) % 60));
    
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      setTimeDisplay('Starting now');
      return;
    }
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Format time string with leading zeros
    setTimeDisplay(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  };
  
  return (
    <div className="font-mono">{timeDisplay}</div>
  );
};

export default MatchCountdown;