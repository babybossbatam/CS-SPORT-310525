import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import AccessibleWrapper from './AccessibleWrapper';
import { Badge } from '@/components/ui/badge';

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  id: number;
  date: string;
  status: {
    short: string;
    long: string;
    elapsed: number | null;
  };
  venue?: {
    id?: number;
    name?: string;
    city?: string;
  };
}

interface League {
  id: number;
  name: string;
  logo: string;
  round?: string;
}

interface Match {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface AccessibleMatchCardProps {
  match: Match;
  className?: string;
  onClick?: () => void;
}

const AccessibleMatchCard: React.FC<AccessibleMatchCardProps> = ({ match, className = '', onClick }) => {
  const { highContrast, largeText, screenReaderMode } = useAccessibility();
  
  // Format match date
  const matchDate = new Date(match.fixture.date);
  const formattedDate = matchDate.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Format match time
  const formattedTime = matchDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get match status
  const isLive = match.fixture.status.short === 'LIVE' || match.fixture.status.short === '1H' || match.fixture.status.short === '2H';
  const isFinished = match.fixture.status.short === 'FT' || match.fixture.status.short === 'AET' || match.fixture.status.short === 'PEN';
  const isUpcoming = !isLive && !isFinished;
  
  // Format score or match time based on status
  const matchStatusText = isLive ? 'LIVE' : isFinished ? 'Final' : 'Upcoming';
  const scoreText = isFinished ? `${match.goals.home} - ${match.goals.away}` : isLive ? `${match.goals.home} - ${match.goals.away}` : 'vs';
  
  // Calculate time remaining or elapsed for screen readers
  let timeDescription = '';
  if (isLive && match.fixture.status.elapsed) {
    timeDescription = `${match.fixture.status.elapsed} minutes played`;
  } else if (isUpcoming) {
    const now = new Date();
    const timeUntilMatch = matchDate.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntilMatch / (1000 * 60 * 60));
    if (hoursUntil < 24) {
      timeDescription = `Starts in ${hoursUntil} hours`;
    } else {
      const daysUntil = Math.floor(hoursUntil / 24);
      timeDescription = `Starts in ${daysUntil} days`;
    }
  } else if (isFinished) {
    const now = new Date();
    const timeSinceMatch = now.getTime() - matchDate.getTime();
    const hoursSince = Math.floor(timeSinceMatch / (1000 * 60 * 60));
    if (hoursSince < 24) {
      timeDescription = `Finished ${hoursSince} hours ago`;
    } else {
      const daysSince = Math.floor(hoursSince / 24);
      timeDescription = `Finished ${daysSince} days ago`;
    }
  }
  
  // Create venue information if available
  const venueInfo = match.fixture.venue?.name ? `at ${match.fixture.venue.name}` : '';
  
  // Create full accessible description for screen readers
  const accessibleDescription = `${match.teams.home.name} versus ${match.teams.away.name}. ${matchStatusText} match. ${scoreText}. ${timeDescription}. ${venueInfo}`;
  
  // Apply high contrast classes conditionally
  const cardClasses = [
    className,
    'match-card p-4 rounded-lg shadow-md mb-4',
    highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white',
    largeText ? 'text-lg' : ''
  ].filter(Boolean).join(' ');
  
  // Apply high contrast for score display
  const scoreClasses = [
    'score-display text-center font-bold my-2',
    highContrast ? 'text-yellow-400' : 'text-gray-800',
    largeText ? 'text-2xl' : 'text-xl'
  ].filter(Boolean).join(' ');
  
  // Apply high contrast for status badge
  const statusClasses = [
    'status-badge px-2 py-1 rounded text-xs inline-block',
    isLive ? (highContrast ? 'bg-yellow-400 text-black animate-pulse' : 'bg-red-600 text-white animate-pulse') :
    isFinished ? (highContrast ? 'bg-gray-200 text-black' : 'bg-gray-600 text-white') :
    (highContrast ? 'bg-blue-400 text-black' : 'bg-blue-600 text-white')
  ].filter(Boolean).join(' ');
  
  return (
    <AccessibleWrapper
      className={cardClasses}
      ariaLabel={`${match.teams.home.name} versus ${match.teams.away.name} match`}
      ariaDescription={accessibleDescription}
      onClick={onClick}
      role="article"
    >
      {/* League and round information */}
      <div className="league-info flex items-center mb-2">
        <img 
          src={match.league.logo} 
          alt={`${match.league.name} logo`} 
          className="w-5 h-5 mr-2" 
          aria-hidden={screenReaderMode}
        />
        <span className={`league-name ${largeText ? 'text-base' : 'text-sm'}`}>{match.league.name}</span>
        {match.league.round && (
          <span className={`round-info ml-2 ${highContrast ? 'text-yellow-300' : 'text-gray-500'} ${largeText ? 'text-sm' : 'text-xs'}`}>
            {match.league.round}
          </span>
        )}
      </div>
      
      {/* Match status indicator */}
      <div className="match-status mb-3">
        {isLive && (
          <div className={statusClasses}>
            LIVE {match.fixture.status.elapsed && `${match.fixture.status.elapsed}'`}
          </div>
        )}
        {!isLive && (
          <div className={`match-time ${largeText ? 'text-base' : 'text-sm'} ${highContrast ? 'text-yellow-300' : 'text-gray-600'}`}>
            {isFinished ? 'Final' : `${formattedDate}, ${formattedTime}`}
          </div>
        )}
      </div>
      
      {/* Teams and score */}
      <div className="teams-container">
        {/* Home team */}
        <div className="team home-team flex items-center mb-2">
          <img 
            src={match.teams.home.logo} 
            alt={`${match.teams.home.name} logo`} 
            className="w-8 h-8 mr-3" 
            aria-hidden={screenReaderMode}
          />
          <span className={`team-name ${highContrast ? 'text-white' : ''} ${largeText ? 'text-lg' : ''}`}>
            {match.teams.home.name}
          </span>
        </div>
        
        {/* Away team */}
        <div className="team away-team flex items-center">
          <img 
            src={match.teams.away.logo} 
            alt={`${match.teams.away.name} logo`} 
            className="w-8 h-8 mr-3"
            aria-hidden={screenReaderMode}
          />
          <span className={`team-name ${highContrast ? 'text-white' : ''} ${largeText ? 'text-lg' : ''}`}>
            {match.teams.away.name}
          </span>
        </div>
      </div>
      
      {/* Score display */}
      <div className={scoreClasses}>
        {scoreText}
      </div>
      
      {/* Venue information if available */}
      {match.fixture.venue?.name && (
        <div className={`venue-info mt-2 ${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-yellow-300' : 'text-gray-500'}`}>
          Venue: {match.fixture.venue.name}
          {match.fixture.venue.city && `, ${match.fixture.venue.city}`}
        </div>
      )}
    </AccessibleWrapper>
  );
};

export default AccessibleMatchCard;