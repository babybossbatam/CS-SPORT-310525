
import { useState, useEffect } from 'react';

interface LeagueMatchScoreboardProps {
  featured?: boolean;
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
}

export function LeagueMatchScoreboard({ 
  featured = false,
  homeTeamColor = '#6f7c93',
  awayTeamColor = '#8b0000',
  compact = false,
}: LeagueMatchScoreboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Keep slideshow functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % 5); // Keeping 5 as max slides
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`flex relative h-[53px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} mt-[-8px]`}
      style={{ background: '#1a1a1a' }}
    >
      <div className="w-full h-full flex justify-between relative">
        <div className="w-full h-full flex items-center justify-center text-white">
          Slide {currentSlideIndex + 1}
        </div>
      </div>
    </div>
  );
}

export default LeagueMatchScoreboard;
