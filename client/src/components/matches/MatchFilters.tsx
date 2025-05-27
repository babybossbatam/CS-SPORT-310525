import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, fixturesActions } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isLiveMatch } from '@/lib/utils';
import { FixtureResponse } from '@/types/fixtures';
import { isToday, isTomorrow } from '@/lib/dateUtilsUpdated';

const MatchFilters = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const selectedFilter = useSelector((state: RootState) => state.ui.selectedFilter);
  const liveFixtures = useSelector((state: RootState) => state.fixtures.live);
  const loading = useSelector((state: RootState) => state.fixtures.loading);
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const fixturesByDate = useSelector((state: RootState) => state.fixtures.byDate[selectedDate] || []);
  const upcomingFixtures = useSelector((state: RootState) => state.fixtures.upcoming);

  // Function to filter and prioritize matches using 365scores-style logic
  const getPrioritizedMatches = (matches: FixtureResponse[]): FixtureResponse[] => {
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter out unwanted matches first
    const filteredMatches = matches.filter(match => {
      if (!match.league || !match.teams) return false;

      // Tier 1 - Elite European Competitions (Always show)
      const eliteCompetitions = ['2', '3']; // Champions League, Europa League
      if (eliteCompetitions.includes(String(match.league.id))) {
        return true;
      }

      // Tier 2 - Top 5 Leagues (High priority)
      // English Premier League has ID 39 and must be from England
      if (match.league.id === 39 && match.league.country.toLowerCase() === 'england') {
        return true;
      }

      // Other top leagues
      const otherTopLeagues = ['140', '135', '78', '61']; // La Liga, Serie A, Bundesliga, Ligue 1
      if (otherTopLeagues.includes(String(match.league.id))) {
        return true;
      }

      // Tier 3 - Other Major European Leagues
      const majorEuropeanLeagues = [
        'eredivisie', 'primeira liga', 'super lig', 'scottish premiership'
      ];
      if (majorEuropeanLeagues.some(league => match.league.name.toLowerCase().includes(league))) {
        return true;
      }

      // Tier 4 - Major Cups & Important Matches
      const majorCups = [
        'fa cup', 'copa del rey', 'dfb pokal', 'coppa italia',
        'league cup', 'super cup'
      ];
      if (majorCups.some(cup => match.league.name.toLowerCase().includes(cup))) {
        return true;
      }

      // Tier 5 - Popular Non-European Leagues
      const popularCountries = [
        'brazil', 'argentina', 'mexico', 'usa', 'saudi arabia'
      ];
      if (popularCountries.includes(match.league.country.toLowerCase())) {
        return true;
      }

      return false;
    });

    // Sort matches by priority
    return filteredMatches.sort((a, b) => {
      // First priority: Live matches
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // Second priority: About to start (within next hour)
      const aStartingSoon = a.fixture.timestamp - currentTime < 3600 && a.fixture.timestamp > currentTime;
      const bStartingSoon = b.fixture.timestamp - currentTime < 3600 && b.fixture.timestamp > currentTime;
      if (aStartingSoon && !bStartingSoon) return -1;
      if (!aStartingSoon && bStartingSoon) return 1;

      // Third priority: Recent finished matches (within last 2 hours)
      const aRecentlyFinished = a.fixture.status.short === 'FT' && currentTime - a.fixture.timestamp < 7200;
      const bRecentlyFinished = b.fixture.status.short === 'FT' && currentTime - b.fixture.timestamp < 7200;
      if (aRecentlyFinished && !bRecentlyFinished) return -1;
      if (!aRecentlyFinished && bRecentlyFinished) return 1;

      // Finally sort by match time
      return a.fixture.timestamp - b.fixture.timestamp;
    });
  };

  useEffect(() => {
    const fetchFixturesByDate = async () => {
      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}`);
        const data = await response.json();

        // Apply filtering before storing
        const prioritizedMatches = getPrioritizedMatches(data);
        dispatch(fixturesActions.setFixturesByDate({ 
          date: selectedDate, 
          fixtures: prioritizedMatches 
        }));
      } catch (error) {
        console.error('Error fetching fixtures:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matches',
          variant: 'destructive',
        });
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };

    fetchFixturesByDate();
  }, [selectedDate, dispatch, toast]);

  // Toggle live filter
  const toggleLiveFilter = () => {
    dispatch(uiActions.setSelectedFilter(
      selectedFilter === 'live' ? 'all' : 'live'
    ));
  };

  // Toggle time filter
  const toggleTimeFilter = () => {
    dispatch(uiActions.setSelectedFilter(
      selectedFilter === 'time' ? 'all' : 'time'
    ));
  };

  if (!mounted) return null;

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <Button
          variant={selectedFilter === 'live' ? 'default' : 'outline'}
          size="sm"
          className={`rounded-full text-xs px-3 py-1 ${
            selectedFilter === 'live' 
              ? 'bg-[#48BB78] text-white hover:bg-[#38A169]' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={toggleLiveFilter}
        >
          {selectedFilter === 'live' && (
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          )}
          <span>LIVE</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
          onClick={toggleTimeFilter}
        >
          <Clock className="h-3 w-3" />
          <span>by time</span>
        </Button>
      </div>
      {/* Match list with Popular Leagues card at the top */}
      <div className="overflow-y-auto max-h-[700px]">
        {fixturesByDate.length > 0 ? (
          <div className="w-full">
            {/* Matches will be displayed in TodayMatches component instead */}
            <div className="space-y-1"></div>
          </div>
        ) : (
          // Empty state
          <div></div>
        )}
      </div>
    </div>
  );
};

export default MatchFilters;