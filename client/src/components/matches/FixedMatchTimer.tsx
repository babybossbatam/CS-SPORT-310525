import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

interface FixedMatchTimerProps {
  matchDate: string;
}

const FixedMatchTimer = ({ matchDate }: FixedMatchTimerProps) => {
  const [timer, setTimer] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateTimer = () => {
      try {
        const targetDate = parseISO(matchDate);
        const now = new Date();
        const currentSeconds = new Date().getSeconds();
        now.setSeconds(currentSeconds);

        const msToMatch = targetDate.getTime() - now.getTime();
        const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));

        if (hoursToMatch >= 12 || hoursToMatch < 0) {
          return;
        }

        const hours = Math.floor(msToMatch / (1000 * 60 * 60));
        const minutes = Math.floor((msToMatch % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msToMatch % (1000 * 60)) / 1000);

        setTimer({ hours, minutes, seconds });
      } catch (e) {
        console.error('Timer calculation error:', e);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [matchDate]);

  const formattedHours = timer.hours.toString().padStart(2, '0');
  const formattedMinutes = timer.minutes.toString().padStart(2, '0');
  const formattedSeconds = timer.seconds.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <span style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="text-red-500">
        {formattedHours}:{formattedMinutes}:{formattedSeconds}
      </span>
    </div>
  );
};

export default FixedMatchTimer;