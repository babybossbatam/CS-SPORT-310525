import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronRight, Clock, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { format, parseISO, isToday as isSameDay } from 'date-fns';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { formatMatchDate, getMatchStatusText, isLiveMatch } from '@/lib/utils';

interface Goals {
  home: number | null;
  away: number | null;
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

interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: {
    halftime: Goals;
    fulltime: Goals;
    extratime: Goals;
    penalty: Goals;
  };
}

const BundesligaSchedule = () => {
  const [, navigate] = useLocation();
  const [visibleFixtures, setVisibleFixtures] = useState<FixtureResponse[]>([]);
  
  // Get selected date from Redux store
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  // Check if selected date is today
  const today = new Date();
  const isToday = parseISO(selectedDate).getDate() === today.getDate() && 
                 parseISO(selectedDate).getMonth() === today.getMonth() && 
                 parseISO(selectedDate).getFullYear() === today.getFullYear();
  
  // Bundesliga ID is 78
  const leagueId = 78;
  const currentYear = new Date().getFullYear();
  
  // Get Bundesliga info
  const { data: leagueInfo } = useQuery({
    queryKey: [`/api/leagues/${leagueId}`],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Get the league fixtures with current season from league info using the dedicated endpoint
  const { data: allFixtures, isLoading, error } = useQuery<FixtureResponse[]>({
    queryKey: [`/api/bundesliga/fixtures`],
    enabled: !!leagueInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Handle fixtures based on selected date
  useEffect(() => {
    if (!allFixtures) return;
    
    const fixtures = [...allFixtures];
    const now = new Date();
    const selectedDateObj = parseISO(selectedDate);
    
    // Filter fixtures by the selected date
    let filteredFixtures: FixtureResponse[] = [];
    
    if (isToday) {
      // For today, show both completed and upcoming matches
      // 1. Get finished and live matches from today
      const todayFinishedMatches = fixtures.filter(f => {
        const fixtureDate = new Date(f.fixture.date);
        return (
          fixtureDate.getDate() === now.getDate() &&
          fixtureDate.getMonth() === now.getMonth() &&
          fixtureDate.getFullYear() === now.getFullYear() &&
          ['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(f.fixture.status.short)
        );
      });
      
      // 2. Get upcoming matches for today
      const todayUpcomingMatches = fixtures.filter(f => {
        const fixtureDate = new Date(f.fixture.date);
        return (
          fixtureDate.getDate() === now.getDate() &&
          fixtureDate.getMonth() === now.getMonth() &&
          fixtureDate.getFullYear() === now.getFullYear() &&
          ['TBD', 'NS', 'WO', 'CANC', 'ABD', 'AWD', 'PST'].includes(f.fixture.status.short)
        );
      });
      
      // 3. Combine them
      filteredFixtures = [...todayFinishedMatches, ...todayUpcomingMatches];
    } else {
      // For other dates, show only completed matches
      filteredFixtures = fixtures.filter(f => {
        const fixtureDate = new Date(f.fixture.date);
        return (
          fixtureDate.getDate() === selectedDateObj.getDate() &&
          fixtureDate.getMonth() === selectedDateObj.getMonth() &&
          fixtureDate.getFullYear() === selectedDateObj.getFullYear() &&
          ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
        );
      });
    }
    
    // Sort by date
    filteredFixtures.sort((a, b) => {
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });
    
    // Limit to 5 fixtures
    setVisibleFixtures(filteredFixtures.slice(0, 5));
    
  }, [allFixtures, selectedDate, isToday]);
  
  // Format match date based on whether it's today or another day
  const formatMatchDateFn = (dateStr: string) => {
    const fixtureDate = parseISO(dateStr);
    const today = new Date();
    
    if (fixtureDate.getDate() === today.getDate() &&
        fixtureDate.getMonth() === today.getMonth() &&
        fixtureDate.getFullYear() === today.getFullYear()) {
      return 'Today';
    }
    
    return formatMatchDate(dateStr);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error || !leagueInfo) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            Failed to load Bundesliga fixtures.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (visibleFixtures.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Bundesliga</span>
            </div>
            <button 
              onClick={() => navigate(`/league/${leagueId}`)}
              className="flex items-center text-xs bg-yellow-800 hover:bg-yellow-900 text-white px-2 py-1 rounded transition-colors"
            >
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <img 
                src="https://media.api-sports.io/football/leagues/78.png"
                alt="Bundesliga" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Bundesliga';
                }}
              />
            </div>
            <p className="text-gray-500 text-sm">
              No {isToday ? "" : "completed"} matches for {isToday ? "today" : format(parseISO(selectedDate), 'MMMM d, yyyy')}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-600" />
            <span className="font-semibold text-yellow-800">Bundesliga</span>
          </div>
          <button 
            onClick={() => navigate(`/league/${leagueId}`)}
            className="flex items-center text-xs bg-yellow-800 hover:bg-yellow-900 text-white px-2 py-1 rounded transition-colors"
          >
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {visibleFixtures.map((fixture) => (
            <div 
              key={fixture.fixture.id} 
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/match/${fixture.fixture.id}`)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatMatchDateFn(fixture.fixture.date)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{format(parseISO(fixture.fixture.date), 'HH:mm')}</span>
                </div>
                <div className="text-xs font-medium">
                  {fixture.league.round}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                {/* Home team */}
                <div className="flex items-center space-x-2 w-2/5">
                  <img 
                    src={fixture.teams.home.logo} 
                    alt={fixture.teams.home.name} 
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                    }}
                  />
                  <span className="font-medium text-sm truncate">{fixture.teams.home.name}</span>
                </div>
                
                {/* Score */}
                <div className="flex flex-col items-center justify-center w-1/5">
                  {/* Show the score for finished or ongoing matches, or time for scheduled matches */}
                  {['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(fixture.fixture.status.short) ? (
                    <div className="flex items-center space-x-1">
                      <span className="font-bold">{fixture.goals.home}</span>
                      <span className="text-gray-400">-</span>
                      <span className="font-bold">{fixture.goals.away}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">{format(parseISO(fixture.fixture.date), 'HH:mm')}</span>
                  )}
                  
                  {/* Match status */}
                  {fixture.fixture.status.short !== 'NS' && (
                    <div className={`text-xs px-1 rounded mt-0.5 ${
                      fixture.fixture.status.short === 'AET' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : fixture.fixture.status.short === 'PEN' 
                          ? 'bg-amber-100 text-amber-800'
                          : isLiveMatch(fixture.fixture.status.short)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getMatchStatusText(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                    </div>
                  )}
                </div>
                
                {/* Away team */}
                <div className="flex items-center justify-end space-x-2 w-2/5">
                  <span className="font-medium text-sm truncate">{fixture.teams.away.name}</span>
                  <img 
                    src={fixture.teams.away.logo} 
                    alt={fixture.teams.away.name} 
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BundesligaSchedule;