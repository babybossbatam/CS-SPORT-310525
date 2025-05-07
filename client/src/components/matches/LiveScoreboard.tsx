import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { getTeamGradient } from '@/lib/utils';

interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface Goals {
  home: number | null;
  away: number | null;
}

interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals: Goals;
  score: Score;
}

// Format match date
const formatMatchDateFn = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "EEEE, do MMM | HH:mm");
};

// Check if match is live or ended
const isLiveMatch = (status: string): boolean => {
  return ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT'].includes(status);
};

const LiveScoreboard = memo(() => {
  const [, navigate] = useLocation();
  
  // Use React Query to fetch live fixtures with proper caching
  const { data: liveFixtures, isLoading: loadingLive } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Get tomorrow's date in YYYY-MM-DD format for upcoming fixtures
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');
  
  // Use React Query to fetch upcoming fixtures with proper caching
  const { data: upcomingFixtures, isLoading: loadingUpcoming } = useQuery<FixtureResponse[]>({
    queryKey: [`/api/fixtures/date/${tomorrowFormatted}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const isLoading = loadingLive || loadingUpcoming;
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="m-4">
        <CardHeader className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Loading Matches...</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // No matches state
  const availableFixtures = [
    ...(liveFixtures || []), 
    ...(upcomingFixtures || [])
  ];
  
  if (availableFixtures.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Featured Matches</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p>No matches available right now.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Use first match as featured
  const featured = availableFixtures[0];
  
  return (
    <div className="mx-2 my-4">
      {/* Match filter controls */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="font-medium text-sm">Today's Matches</div>
        
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    
      {/* Featured match card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Featured Match badge */}
        <div className="absolute top-0 right-0 bg-gray-700 text-white text-xs px-2 py-1 rounded-bl-md">
          Featured Match
        </div>
        
        {/* League and status info */}
        <div className="text-center p-2 flex justify-center items-center gap-2">
          <img 
            src={featured.league.logo}
            alt={featured.league.name}
            className="w-4 h-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=L';
            }}
          />
          <span className="text-sm">{featured.league.name} - {featured.league.round}</span>
        </div>
        
        {/* Status badge */}
        <div className="text-xs text-center text-gray-500 -mt-1 mb-1">
          {isLiveMatch(featured.fixture.status.short) ? 'Live' : 
           featured.fixture.status.short === 'FT' ? 'Ended' : 'Scheduled'}
        </div>
        
        {/* Score */}
        <div className="text-center px-4 py-1">
          <div className="text-3xl font-bold">
            {featured.goals.home !== null ? featured.goals.home : '0'} - {featured.goals.away !== null ? featured.goals.away : '0'}
          </div>
        </div>
        
        {/* Teams with dynamic gradients based on team names - equal width meeting in middle */}
        <div className="flex rounded-md overflow-hidden relative h-16">
          {/* Container for both gradients that meet in the middle with same width */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center" style={{ height: '40px' }}>
            {/* Home team logo - positioned at the leftmost */}
            <div className="absolute bottom-0 left-0 z-10">
              <img 
                src={featured.teams.home.logo} 
                alt={featured.teams.home.name}
                className="h-16 w-16 transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            
            {/* Home team - gradient extending exactly 50% */}
            <div className={`h-full w-1/2 ${getTeamGradient(featured.teams.home.name, 'to-r')} flex items-center`}>
              <div className="ml-20 text-white font-bold text-lg uppercase">{featured.teams.home.name}</div>
            </div>
            
            {/* Away team - gradient extending exactly 50% */}
            <div className={`h-full w-1/2 ${getTeamGradient(featured.teams.away.name, 'to-l')} flex items-center justify-end`}>
              <div className="mr-20 text-white font-bold text-lg uppercase text-right">{featured.teams.away.name}</div>
            </div>
            
            {/* Away team logo - positioned at the rightmost */}
            <div className="absolute bottom-0 right-0 z-10">
              <img 
                src={featured.teams.away.logo} 
                alt={featured.teams.away.name}
                className="h-16 w-16 transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
          </div>
          
          {/* VS label (positioned in center of gradient containers) */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 text-white font-bold text-xl bg-black/80 rounded-full h-8 w-8 flex items-center justify-center z-20" style={{ marginBottom: '16px', bottom: '16px' }}>
            VS
          </div>
        </div>
        
        {/* Match details footer */}
        <div className="p-2 text-center text-sm border-t border-gray-100">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{formatMatchDateFn(featured.fixture.date)}</span>
            {featured.fixture.venue.name && (
              <span> | {featured.fixture.venue.name}</span>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-4 border-t border-gray-200">
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="text-xs mt-1">Match Page</div>
            </div>
          </button>
          
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-xs mt-1">Lineups</div>
            </div>
          </button>
          
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-xs mt-1">Stats</div>
            </div>
          </button>
          
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => navigate(`/league/${featured.league.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div className="text-xs mt-1">Bracket</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});

export default LiveScoreboard;