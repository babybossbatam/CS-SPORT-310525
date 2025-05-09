import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, LineChart, Trophy } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { useLocation } from 'wouter';
import { formatDateTime, isLiveMatch } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { FixtureResponse } from '../../../../server/types';

// Constant from UpcomingMatchesScoreboard
const FEATURED_LEAGUE_IDS = [
  135, // Serie A (Italy)
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  39,  // Premier League (England)
];

const NewFeaturedMatch = () => {
  const [, navigate] = useLocation();
  const [featuredMatch, setFeaturedMatch] = useState<FixtureResponse | null>(null);
  
  // Load Champions League fixtures
  const { data: championsLeagueFixtures = [], isLoading: isLoadingCL } = useQuery({
    queryKey: ['/api/champions-league/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/champions-league/fixtures');
      return response.json();
    }
  });
  
  // Load Europa League fixtures
  const { data: europaLeagueFixtures = [], isLoading: isLoadingEL } = useQuery({
    queryKey: ['/api/europa-league/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/europa-league/fixtures');
      return response.json();
    }
  });
  
  // Load Serie A fixtures
  const { data: serieAFixtures = [], isLoading: isLoadingSA } = useQuery({
    queryKey: ['/api/leagues/135/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/leagues/135/fixtures');
      return response.json();
    }
  });
  
  // Load Premier League fixtures
  const { data: premierLeagueFixtures = [], isLoading: isLoadingPL } = useQuery({
    queryKey: ['/api/leagues/39/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/leagues/39/fixtures');
      return response.json();
    }
  });
  
  // Process fixtures when data is loaded
  useEffect(() => {
    if (!championsLeagueFixtures.length && !europaLeagueFixtures.length && 
        !serieAFixtures.length && !premierLeagueFixtures.length) {
      return; // No data loaded yet
    }
    
    console.log("Processing fixtures for NewFeaturedMatch");
    
    // Combine all fixtures
    const allFixtures: FixtureResponse[] = [];
    
    // Add fixtures from each league, avoiding duplicates
    const processedIds = new Set<number>();
    
    const addFixtures = (fixtures: FixtureResponse[], source: string) => {
      console.log(`Adding fixtures from ${source}: ${fixtures.length}`);
      fixtures.forEach(fixture => {
        if (!processedIds.has(fixture.fixture.id)) {
          processedIds.add(fixture.fixture.id);
          allFixtures.push(fixture);
        }
      });
    };
    
    addFixtures(championsLeagueFixtures, 'Champions League');
    addFixtures(europaLeagueFixtures, 'Europa League');
    addFixtures(serieAFixtures, 'Serie A');
    addFixtures(premierLeagueFixtures, 'Premier League');
    
    console.log(`Total combined fixtures: ${allFixtures.length}`);
    
    // Get the current time in seconds (unix timestamp)
    const currentTime = Math.floor(Date.now() / 1000);
    const eightHoursInSeconds = 8 * 60 * 60; // 8 hours in seconds
    
    // Filter matches for featured display
    const filteredMatches = allFixtures.filter(match => {
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
    
    console.log(`Filtered matches: ${filteredMatches.length}`);
    
    // Sort matches by priority
    const sortedMatches = filteredMatches.sort((a, b) => {
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
      
      // Finally sort by timestamp for matches with the same priority
      return a.fixture.timestamp - b.fixture.timestamp;
    });
    
    if (sortedMatches.length > 0) {
      console.log(`Featured match selected: ${sortedMatches[0].teams.home.name} vs ${sortedMatches[0].teams.away.name}`);
      setFeaturedMatch(sortedMatches[0]);
    } else {
      console.log("No matches available for featuring");
    }
  }, [championsLeagueFixtures, europaLeagueFixtures, serieAFixtures, premierLeagueFixtures]);
  
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
      return format(date, 'E, MMM d');
    }
  };
  
  // Loading state
  if (isLoadingCL || isLoadingEL || isLoadingSA || isLoadingPL) {
    return (
      <Card className="mb-6">
        <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mx-auto mb-6" />
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="flex flex-col items-center w-1/3">
              <Skeleton className="h-16 w-16 rounded-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-col items-center w-1/3">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex flex-col items-center w-1/3">
              <Skeleton className="h-16 w-16 rounded-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No match state
  if (!featuredMatch) {
    return null;
  }
  
  // Render featured match
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Trophy className="h-4 w-4 text-neutral-500 mr-2" />
          <span className="text-sm font-medium">{featuredMatch.league.name} - {featuredMatch.league.round}</span>
        </div>
        <Badge variant="secondary" className="bg-neutral-300 text-xs font-medium py-1 px-2 rounded">
          Featured Match
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold text-center mb-6">
          {formatMatchDate(featuredMatch.fixture.date)}
        </h2>
        
        <div className="flex justify-center items-center space-x-4 mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-16 w-16 mb-2 flex items-center justify-center">
              <img 
                src={featuredMatch.teams.home.logo} 
                alt={featuredMatch.teams.home.name} 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-semibold text-center">{featuredMatch.teams.home.name}</span>
          </div>
          
          {/* VS or Score */}
          <div className="flex flex-col items-center w-1/3">
            {/* Show score if match is in progress or finished */}
            {(featuredMatch.fixture.status.short === 'FT' || 
              featuredMatch.fixture.status.short === 'AET' || 
              featuredMatch.fixture.status.short === 'PEN' || 
              featuredMatch.fixture.status.short === 'IN_PLAY' || 
              featuredMatch.fixture.status.short === 'HT') ? (
              <div className="text-3xl font-bold text-neutral-500 mb-2">
                {featuredMatch.goals.home} - {featuredMatch.goals.away}
                {featuredMatch.fixture.status.short === 'AET' && 
                  <span className="text-xs ml-2 text-blue-600">AET</span>}
                {featuredMatch.fixture.status.short === 'PEN' && 
                  <span className="text-xs ml-2 text-blue-600">PEN</span>}
                {featuredMatch.fixture.status.short === 'IN_PLAY' && 
                  <span className="text-xs ml-2 text-red-600">LIVE</span>}
                {featuredMatch.fixture.status.short === 'HT' && 
                  <span className="text-xs ml-2 text-orange-600">HT</span>}
              </div>
            ) : (
              <div className="text-3xl font-bold text-neutral-500 mb-2">VS</div>
            )}
            <div className="text-sm text-neutral-500">
              {formatDateTime(featuredMatch.fixture.date)}
              {featuredMatch.fixture.venue.name && ` | ${featuredMatch.fixture.venue.name}`}
            </div>
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-16 w-16 mb-2 flex items-center justify-center">
              <img 
                src={featuredMatch.teams.away.logo} 
                alt={featuredMatch.teams.away.name} 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-semibold text-center">{featuredMatch.teams.away.name}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/match/${featuredMatch.fixture.id}/h2h`)}
          >
            <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">H2H</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/match/${featuredMatch.fixture.id}/stats`)}
          >
            <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Stats</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/league/${featuredMatch.league.id}/bracket`)}
          >
            <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Bracket</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewFeaturedMatch;