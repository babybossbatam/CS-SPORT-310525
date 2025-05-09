import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { FixtureResponse } from '../../../../server/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Same league list as UpcomingMatchesScoreboard
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  135, // Serie A (Italy)
];

const TodayMatches = () => {
  const [, navigate] = useLocation();
  
  // Get fixture data using React Query
  const { data: championsLeagueFixtures = [], isLoading: isChampionsLeagueLoading } = useQuery({
    queryKey: ['/api/champions-league/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/champions-league/fixtures');
      return response.json();
    }
  });
  
  const { data: europaLeagueFixtures = [], isLoading: isEuropaLeagueLoading } = useQuery({
    queryKey: ['/api/europa-league/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/europa-league/fixtures');
      return response.json();
    }
  });
  
  const { data: serieAFixtures = [], isLoading: isSerieALoading } = useQuery({
    queryKey: ['/api/leagues/135/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/leagues/135/fixtures');
      return response.json();
    }
  });
  
  const { data: liveFixtures = [], isLoading: isLiveLoading } = useQuery({
    queryKey: ['/api/fixtures/live'],
    queryFn: async () => {
      const response = await fetch('/api/fixtures/live');
      return response.json();
    }
  });
  
  // Helper to check if a match is live
  const isLiveMatch = (status: string): boolean => {
    return ['LIVE', '1H', '2H', 'HT'].includes(status);
  };
  
  // Format date for match display (Today, Tomorrow, or date)
  const formatMatchDate = (dateString: string): string => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM dd');
    }
  };
  
  // Format time from timestamp (HH:MM format)
  const formatMatchTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return format(date, 'HH:mm');
  };
  
  // Combine all fixtures and sort them by timestamp
  const allFixtures = [...liveFixtures, ...championsLeagueFixtures, ...europaLeagueFixtures, ...serieAFixtures];
  
  // Get the current time in seconds (unix timestamp)
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Filter and sort matches
  const filteredFixtures = allFixtures
    // Remove duplicates by fixture ID
    .filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
    )
    // Only include upcoming matches (timestamp > current time)
    .filter(fixture => fixture.fixture.timestamp > currentTime)
    // Filter to only include our priority leagues
    .filter(fixture => POPULAR_LEAGUES.includes(fixture.league.id))
    // Sort by timestamp (nearest first)
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

  // Take the first 5 fixtures for the today matches display
  const upcomingMatches = filteredFixtures.slice(0, 5);
  
  // Display loading state
  if (isChampionsLeagueLoading || isEuropaLeagueLoading || isSerieALoading || isLiveLoading) {
    return (
      <div className="animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Display empty state
  if (upcomingMatches.length === 0) {
    return (
      <div className="text-center p-3 text-gray-500">
        No upcoming matches found.
      </div>
    );
  }
  
  return (
    <div>
      {/* Navigation tabs */}
      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="relative w-full">
          <div className="absolute left-0 top-0 bg-neutral-700 text-white text-xs px-2 py-1 rounded-sm">
            Upcoming
          </div>
          <div className="absolute right-0 top-0 text-xs px-2 py-1 rounded-sm flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>By time</span>
          </div>
          <div className="h-6"></div> {/* Spacer for absolute elements */}
        </div>
      </div>
      
      {/* Main content */}
      <div className="space-y-1 mt-2">
        {/* Display upcoming fixtures */}
        {upcomingMatches.map((match) => (
          <div 
            key={match.fixture.id}
            className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
            onClick={() => navigate(`/match/${match.fixture.id}`)}
          >
            <div className="flex items-center justify-between mb-1">
              <img 
                src={match.teams.home.logo} 
                alt={match.teams.home.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                }}
              />
              <div className="text-center text-xs flex flex-col">
                <div className="flex items-center justify-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-gray-500">{formatMatchDate(match.fixture.date)}</span>
                </div>
                <span className="font-semibold">{formatMatchTime(match.fixture.timestamp)}</span>
              </div>
              <img 
                src={match.teams.away.logo} 
                alt={match.teams.away.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm w-[40%] text-left truncate">{match.teams.home.name}</span>
              <div className="text-xs text-gray-500 text-center">
                {match.league.name}
              </div>
              <span className="text-sm w-[40%] text-right truncate">{match.teams.away.name}</span>
            </div>
          </div>
        ))}
        
        {/* Link to Champions League page */}
        <div className="mt-2 text-center">
          <a 
            href="#" 
            className="text-xs text-blue-600 hover:underline block py-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/leagues/2');
            }}
          >
            UEFA Champions League Bracket &gt;
          </a>
        </div>
      </div>
    </div>
  );
};

export default TodayMatches;