import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Activity, Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMatchDateFn, isLiveMatch } from '@/lib/utils';
import { getTeamColor } from '@/lib/colorExtractor';
import { useLocation } from 'wouter';

// League IDs we care about (only show matches from these leagues)
const FEATURED_LEAGUE_IDS = [
  135,  // Serie A (Italy)
  2,    // UEFA Champions League
  3,    // UEFA Europa League
  39,   // Premier League
];

// Define the types we need
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

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

const UpcomingMatchesScoreboard = () => {
  const [, navigate] = useLocation();
  const [upcomingMatches, setUpcomingMatches] = useState<FixtureResponse[]>([]);
  const [allMatches, setAllMatches] = useState<FixtureResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const matchesPerPage = 1; // Show only 1 match per page as requested
  
  // We are no longer getting tomorrow's fixtures directly
  // Instead, we'll only use our curated league fixtures
  
  // Fetch live fixtures
  const { data: liveFixtures, isLoading: isLiveLoading } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch Champions League fixtures
  const { data: championsLeagueFixtures, isLoading: isChampionsLeagueLoading } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/champions-league/fixtures'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch Europa League fixtures
  const { data: europaLeagueFixtures, isLoading: isEuropaLeagueLoading } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/europa-league/fixtures'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch Serie A fixtures (ID 135)
  const { data: serieAFixtures, isLoading: isSerieALoading } = useQuery<FixtureResponse[]>({
    queryKey: [`/api/leagues/135/fixtures`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Process the fixtures when data is available
  useEffect(() => {
    if (!liveFixtures && !championsLeagueFixtures && !europaLeagueFixtures && !serieAFixtures) return;
    
    console.log("Processing fixtures for upcoming matches scoreboard");
    
    // Create a map to track unique fixture IDs and detect duplicates
    const fixtureIdMap = new Map<number, FixtureResponse>();
    
    // Process each data source in order of priority, only adding new unique fixtures
    const processSource = (fixtures: FixtureResponse[] | undefined, sourceName: string) => {
      if (!fixtures) return;
      
      let addedCount = 0;
      fixtures.forEach(fixture => {
        if (!fixtureIdMap.has(fixture.fixture.id)) {
          fixtureIdMap.set(fixture.fixture.id, fixture);
          addedCount++;
        }
      });
      
      console.log(`Added ${addedCount} unique fixtures from ${sourceName}`);
    };
    
    // Process sources in order of priority
    processSource(liveFixtures, "Live");
    processSource(championsLeagueFixtures, "Champions League");
    processSource(europaLeagueFixtures, "Europa League");
    processSource(serieAFixtures, "Serie A");
    
    // Convert map back to array
    const uniqueFixtures = Array.from(fixtureIdMap.values());
    console.log(`Total unique fixtures: ${uniqueFixtures.length}`);
    
    // Log some example timestamp data for debugging
    const currentUnixTime = new Date().getTime() / 1000;
    if (uniqueFixtures.length > 0) {
      const sample = uniqueFixtures[0];
      const timeUntilMatch = sample.fixture.timestamp - currentUnixTime;
      console.log(`Current time (unix): ${currentUnixTime}`);
      console.log(`Example match: ${sample.teams.home.name} vs ${sample.teams.away.name}`);
      console.log(`Match timestamp: ${sample.fixture.timestamp}`);
      console.log(`Time until match: ${timeUntilMatch} seconds (${(timeUntilMatch / 3600).toFixed(2)} hours)`);
    }
    
    // Implement the new logic for showing matches in the scoreboard:
    // 1. Today's finished matches less than 8 hours old
    // 2. Upcoming matches (not yet started)
    // 3. Limit to maximum 5 pages (5 matches)
    
    const currentTime = new Date().getTime() / 1000; // Current time in seconds
    const eightHoursInSeconds = 8 * 60 * 60; // 8 hours in seconds
    
    const scoreBoardMatches = uniqueFixtures.filter(match => {
      // Only include matches from our featured leagues
      if (!FEATURED_LEAGUE_IDS.includes(match.league.id)) {
        return false;
      }
      
      // Get time difference from current time
      const timeDiff = currentTime - match.fixture.timestamp;
      
      // Case 1: Today's finished matches that aren't more than 8 hours old
      if (
        (match.fixture.status.short === 'FT' || 
         match.fixture.status.short === 'AET' || 
         match.fixture.status.short === 'PEN') && 
        timeDiff >= 0 && 
        timeDiff <= eightHoursInSeconds
      ) {
        return true;
      }
      
      // Case 2: Upcoming matches (not yet started)
      if (
        (match.fixture.status.short === 'NS' || 
         match.fixture.status.short === 'TBD') && 
        match.fixture.timestamp > currentTime
      ) {
        return true;
      }
      
      // Case 3: Live matches
      if (isLiveMatch(match.fixture.status.short)) {
        return true;
      }
      
      // Exclude all other matches
      return false;
    });
    
    console.log(`After filtering, found ${scoreBoardMatches.length} matches for scoreboard`);
    
    // Custom sort order: Champions League (2), Europa League (3), Serie A (135), Premier League (39)
    const leaguePriority: Record<number, number> = {
      2: 1,  // Champions League - highest priority
      3: 2,  // Europa League - second priority
      135: 3, // Serie A - third priority
      39: 4,  // Premier League - fourth priority
      // Any other league will have lower priority
    };
    
    const sortedFixtures = scoreBoardMatches.sort((a, b) => {
      // First sort by match status: Live > Upcoming > Finished
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      // Check if matches are finished
      const aIsFinished = ['FT', 'AET', 'PEN'].includes(a.fixture.status.short);
      const bIsFinished = ['FT', 'AET', 'PEN'].includes(b.fixture.status.short);
      
      // Live matches get highest priority
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then upcoming matches (sort by nearest timestamp)
      if (!aIsFinished && !aIsLive && bIsFinished) return -1;
      if (aIsFinished && !bIsFinished && !bIsLive) return 1;
      
      // For upcoming matches, sort by nearest time first
      const aTimeUntilMatch = a.fixture.timestamp - currentTime;
      const bTimeUntilMatch = b.fixture.timestamp - currentTime;
      
      if (!aIsFinished && !bIsFinished) {
        return aTimeUntilMatch - bTimeUntilMatch; // Nearest match first
      }
      
      // For finished matches, sort by most recent first
      if (aIsFinished && bIsFinished) {
        return b.fixture.timestamp - a.fixture.timestamp; // Most recent first
      }
      
      // If both matches have the same status category, use league priority
      const aPriority = leaguePriority[a.league.id] || 999;
      const bPriority = leaguePriority[b.league.id] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Finally sort by timestamp for matches with the same priority
      return a.fixture.timestamp - b.fixture.timestamp;
    });
    
    // Limit to maximum 5 pages (5 matches)
    const limitedFixtures = sortedFixtures.slice(0, 5);
    
    // Log top matches after sorting to verify order
    console.log("Sorted matches for scoreboard (first 3):");
    limitedFixtures.slice(0, 3).forEach((match, index) => {
      const timeUntilMatch = match.fixture.timestamp - currentTime;
      const status = isLiveMatch(match.fixture.status.short) 
        ? "LIVE" 
        : ['FT', 'AET', 'PEN'].includes(match.fixture.status.short)
          ? match.fixture.status.short
          : `${(timeUntilMatch / 3600).toFixed(2)} hours until kickoff`;
      
      console.log(`${index+1}. ${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name}) - ${status}`);
    });
    
    // Store all matches for pagination
    setAllMatches(limitedFixtures);
    
    // Set the first page of matches
    updateCurrentPage(0, limitedFixtures);
  }, [liveFixtures, championsLeagueFixtures, europaLeagueFixtures, serieAFixtures]);
  
  // Function to update the current page of matches to display
  const updateCurrentPage = (page: number, fixtures = allMatches) => {
    const startIndex = page * matchesPerPage;
    const paginated = fixtures.slice(startIndex, startIndex + matchesPerPage);
    console.log(`Showing ${paginated.length} matches on page ${page + 1} of ${Math.ceil(fixtures.length / matchesPerPage)}`);
    setUpcomingMatches(paginated);
    setCurrentPage(page);
  };
  
  // Navigate to next page
  const nextPage = () => {
    const maxPage = Math.ceil(allMatches.length / matchesPerPage) - 1;
    if (currentPage < maxPage) {
      updateCurrentPage(currentPage + 1);
    } else {
      // If on the last page, loop back to page 1
      updateCurrentPage(0);
    }
  };
  
  // Navigate to previous page
  const prevPage = () => {
    if (currentPage > 0) {
      updateCurrentPage(currentPage - 1);
    } else {
      // If on the first page, loop back to the last page
      const maxPage = Math.ceil(allMatches.length / matchesPerPage) - 1;
      updateCurrentPage(maxPage);
    }
  };
  
  // Loading state
  if (isLiveLoading || isChampionsLeagueLoading || isEuropaLeagueLoading || isSerieALoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              <span className="font-semibold">Upcoming Matches</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-16 w-full mb-3" />
            <Skeleton className="h-16 w-full mb-3" />
            <Skeleton className="h-16 w-full mb-3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!upcomingMatches || upcomingMatches.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              <span className="font-semibold">Upcoming Matches</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="bg-gray-50 text-gray-800 p-3 rounded-md border border-gray-200 text-sm">
              <p className="font-medium">No upcoming matches are scheduled at this time.</p>
              <p className="mt-1 text-xs text-gray-600">Check back later for match updates.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-3">
        <div className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          <span className="font-semibold">Upcoming Matches</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {upcomingMatches.map((match) => (
            <div 
              key={match.fixture.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/match/${match.fixture.id}`)}
            >
              {/* Match header with League and date */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <img 
                    src={match.league.logo} 
                    alt={match.league.name} 
                    className="h-5 w-5 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                    }}
                  />
                  <span className="text-xs font-medium truncate max-w-[160px]">{match.league.name}</span>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{formatMatchDateFn(match.fixture.date)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{format(parseISO(match.fixture.date), 'HH:mm')}</span>
                </div>
              </div>
              
              {/* Live indicator */}
              {isLiveMatch(match.fixture.status.short) && (
                <div className="flex items-center justify-center mb-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium flex items-center">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                    LIVE {match.fixture.status.elapsed && `(${match.fixture.status.elapsed}')`}
                  </span>
                </div>
              )}
              
              {/* Teams and score */}
              <div className="flex items-center justify-between mt-2">
                {/* Home team */}
                <div className="flex items-center space-x-2 w-[42%]">
                  <div className="relative">
                    {/* Shadow effect */}
                    <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[2px] transform translate-y-0.5"></div>
                    <img 
                      src={match.teams.home.logo} 
                      alt={match.teams.home.name} 
                      className="h-10 w-10 relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=T';
                      }}
                    />
                  </div>
                  <span className="font-medium text-sm truncate">{match.teams.home.name}</span>
                </div>
                
                {/* Score */}
                <div className="w-[16%] flex items-center justify-center px-3 rounded">
                  {isLiveMatch(match.fixture.status.short) ? (
                    <div className="bg-gray-100 px-3 py-1 rounded min-w-[60px] text-center">
                      <span className="font-bold text-gray-900">
                        {match.goals.home ?? 0} - {match.goals.away ?? 0}
                      </span>
                    </div>
                  ) : match.fixture.status.short === 'FT' ? (
                    <div className="bg-gray-100 px-3 py-1 rounded min-w-[60px] text-center">
                      <span className="font-bold text-gray-900">
                        {match.goals.home ?? 0} - {match.goals.away ?? 0}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 font-semibold">vs</span>
                  )}
                </div>
                
                {/* Away team */}
                <div className="flex items-center justify-end space-x-2 w-[42%]">
                  <span className="font-medium text-sm truncate">{match.teams.away.name}</span>
                  <div className="relative">
                    {/* Shadow effect */}
                    <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[2px] transform translate-y-0.5"></div>
                    <img 
                      src={match.teams.away.logo} 
                      alt={match.teams.away.name} 
                      className="h-10 w-10 relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=T';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Status indicator bar - colored based on home/away team */}
              <div className="h-1 w-full mt-2 rounded-full overflow-hidden flex">
                <div 
                  className="w-[60%] h-full rounded-l-full" 
                  style={{ backgroundColor: getTeamColor(match.teams.home.name, true) }}
                ></div>
                <div 
                  className="w-[40%] h-full rounded-r-full" 
                  style={{ backgroundColor: getTeamColor(match.teams.away.name, true) }}
                ></div>
              </div>
              
              {/* Venue info */}
              {match.fixture.venue.name && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {match.fixture.venue.name}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Pagination controls */}
        {allMatches.length > matchesPerPage && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
            <button
              onClick={prevPage}
              className="flex items-center text-xs px-2 py-1 rounded transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              {currentPage === 0 ? 'Last Page' : 'Previous'}
            </button>
            
            <div className="text-xs text-gray-500">
              Page {currentPage + 1} of {Math.ceil(allMatches.length / matchesPerPage)}
            </div>
            
            <button
              onClick={nextPage}
              className="flex items-center text-xs px-2 py-1 rounded transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              {currentPage >= Math.ceil(allMatches.length / matchesPerPage) - 1 ? 'Back to First' : 'Next'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMatchesScoreboard;