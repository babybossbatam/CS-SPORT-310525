import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Link } from 'wouter';

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
}

const AccessibleMatchCard: React.FC<AccessibleMatchCardProps> = ({ match, className = '' }) => {
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
    const hoursUntilMatch = Math.floor(timeUntilMatch / (1000 * 60 * 60));
    
    if (hoursUntilMatch < 24) {
      timeDescription = `Starting in ${hoursUntilMatch} hours`;
    } else {
      const daysUntilMatch = Math.floor(hoursUntilMatch / 24);
      timeDescription = `Starting in ${daysUntilMatch} days`;
    }
  }
  
  // Enhanced ARIA description for screen readers
  const matchAriaDescription = `${match.teams.home.name} versus ${match.teams.away.name}, ${matchStatusText} match in ${match.league.name}. ${
    isFinished ? `Final score: ${match.goals.home} to ${match.goals.away}.` :
    isLive ? `Current score: ${match.goals.home} to ${match.goals.away}. ${timeDescription}.` :
    `${timeDescription}. Match will be played at ${formattedTime} on ${formattedDate}`
  }${match.fixture.venue?.name ? ` at ${match.fixture.venue.name}` : ''}.`;
  
  return (
    <Link 
      to={`/match/${match.fixture.id}`}
      className={`match-card p-4 rounded-lg ${className} ${highContrast ? 'high-contrast-match-card' : ''}`}
      aria-label={matchAriaDescription}
    >
      <div className="match-card-inner">
        {/* League info with proper aria labels */}
        <div className="league-info mb-2 flex items-center" aria-label={`${match.league.name} ${match.league.round || ''}`}>
          <img 
            src={match.league.logo} 
            alt={`${match.league.name} logo`} 
            className="w-6 h-6 mr-2" 
            aria-hidden={screenReaderMode}
          />
          <span className="league-name text-sm">{match.league.name}</span>
          {match.league.round && (
            <span className="round-info text-xs ml-2 text-gray-500">{match.league.round}</span>
          )}
        </div>
        
        {/* Match status indicator */}
        <div className="match-status mb-3">
          {isLive && (
            <div className="live-indicator bg-red-600 text-white px-2 py-1 rounded text-xs inline-block">
              LIVE {match.fixture.status.elapsed && `${match.fixture.status.elapsed}'`}
            </div>
          )}
          {!isLive && (
            <div className="match-time text-sm text-gray-600">
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
            <span className="team-name">{match.teams.home.name}</span>
          </div>
          
          {/* Away team */}
          <div className="team away-team flex items-center">
            <img 
              src={match.teams.away.logo} 
              alt={`${match.teams.away.name} logo`} 
              className="w-8 h-8 mr-3" 
              aria-hidden={screenReaderMode}
            />
            <span className="team-name">{match.teams.away.name}</span>
          </div>
          
          {/* Score display */}
          <div className="score-display absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-bold">
            {scoreText}
          </div>
        </div>
        
        {/* Venue information for screen readers */}
        {match.fixture.venue?.name && (
          <div className="venue-info mt-2 text-xs text-gray-500" aria-label={`Venue: ${match.fixture.venue.name}, ${match.fixture.venue.city || ''}`}>
            <span>Venue: {match.fixture.venue.name}</span>
            {match.fixture.venue.city && <span>, {match.fixture.venue.city}</span>}
          </div>
        )}
        
        {/* Skip to match details link for keyboard navigation */}
        {screenReaderMode && (
          <div className="sr-only">
            Press Enter to view detailed match information
          </div>
        )}
      </div>
    </Link>
  );
};

export default AccessibleMatchCard;