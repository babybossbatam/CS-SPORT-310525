import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isSameDay } from 'date-fns';
import { Star, Calendar, Clock, ChevronRight, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ChampionsLeagueHeader from './ChampionsLeagueHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMatchDateFn, isLiveMatch } from '@/lib/utils';
import { getTeamColor } from '@/lib/colorUtils';
import { useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

const ChampionsLeagueSchedule = () => {
  const [, navigate] = useLocation();
  const [visibleFixtures, setVisibleFixtures] = useState([]);

  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const isToday = isSameDay(parseISO(selectedDate), new Date());

  const leagueId = 2;
  const currentYear = new Date().getFullYear();

  const { data: leagueInfo } = useQuery({
    queryKey: [`/api/leagues/${leagueId}`],
    staleTime: 60 * 60 * 1000,
  });

  const { data: allFixtures, isLoading, error } = useQuery({
    queryKey: [`/api/leagues/${leagueId}/fixtures`],
    enabled: !!leagueInfo,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!allFixtures) return;

    const fixtures = [...allFixtures];
    const now = new Date();
    const selectedDateObj = parseISO(selectedDate);

    let filteredFixtures = [];

    if (isToday) {
      const todayFinishedMatches = fixtures.filter(f => {
        const fixtureDate = new Date(f.fixture.date);
        return (
          isSameDay(fixtureDate, now) && 
          (f.fixture.status.short === 'FT' || 
           f.fixture.status.short === 'AET' || 
           f.fixture.status.short === 'PEN' || 
           isLiveMatch(f.fixture.status.short))
        );
      });

      const todayUpcomingMatches = fixtures.filter(f => {
        const fixtureDate = new Date(f.fixture.date);
        return (
          isSameDay(fixtureDate, now) && 
          f.fixture.status.short !== 'FT' && 
          f.fixture.status.short !== 'AET' && 
          f.fixture.status.short !== 'PEN' && 
          !isLiveMatch(f.fixture.status.short)
        );
      });

      filteredFixtures = [...todayFinishedMatches, ...todayUpcomingMatches];
    } else {
      filteredFixtures = fixtures.filter(f => {
        const fixtureDate = new Date(f.fixture.date);
        return isSameDay(fixtureDate, selectedDateObj);
      });
    }

    setVisibleFixtures(filteredFixtures);
  }, [allFixtures, selectedDate, isToday]);

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <CardHeader className="p-3">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-indigo-600" />
            <span className="font-semibold text-indigo-800">UEFA Champions League</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center">
            <p>Error loading Champions League fixtures</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!visibleFixtures || visibleFixtures.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="p-3">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-indigo-600" />
            <span className="font-semibold text-indigo-800">UEFA Champions League</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center">
            <p>No matches scheduled for this date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ChampionsLeagueHeader />
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="p-3 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800">
                  Next Round: Quarter-finals
                </span>
              </div>
              <div className="text-xs text-indigo-600">
                3 days until next matches
              </div>
            </div>
          </div>
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
                  <div className="flex items-center space-x-2 w-2/5">
                    <img 
                      src={fixture.teams.home.logo} 
                      alt={fixture.teams.home.name} 
                      className="h-6 w-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                      }}
                    />
                    <span className="font-medium text-sm truncate">{fixture.teams.home.name}</span>
                  </div>
                  <div className="flex items-center justify-center px-3 py-1 rounded min-w-[60px] text-center">
                    {isLiveMatch(fixture.fixture.status.short) ? (
                      <div className="flex items-center">
                        <span className="font-bold text-sm mr-1">
                          {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                        </span>
                        <span className="text-xs text-red-500 animate-pulse font-semibold">
                          LIVE
                        </span>
                      </div>
                    ) : fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || fixture.fixture.status.short === 'PEN' ? (
                      <span className="font-bold text-sm">
                        {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">vs</span>
                    )}
                  </div>
                  <div className="flex items-center justify-end space-x-2 w-2/5">
                    <span className="font-medium text-sm truncate">{fixture.teams.away.name}</span>
                    <img 
                      src={fixture.teams.away.logo} 
                      alt={fixture.teams.away.name} 
                      className="h-6 w-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ChampionsLeagueSchedule;