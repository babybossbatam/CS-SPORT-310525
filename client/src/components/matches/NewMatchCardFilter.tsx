
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { formatYYYYMMDD, getCurrentUTCDateString, getRelativeDateDisplayName } from '@/lib/dateUtilsUpdated';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { isLiveMatch } from '@/lib/utils';
import { FixtureResponse } from '@/types/fixtures';

interface NewMatchCardFilterProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

// 365scores.com style filtering configuration
const TIER_1_COMPETITIONS = [2, 3]; // Champions League, Europa League
const TIER_2_TOP_LEAGUES = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
const TIER_3_MAJOR_EUROPEAN = ['eredivisie', 'primeira liga', 'super lig', 'scottish premiership'];
const TIER_4_MAJOR_CUPS = ['fa cup', 'copa del rey', 'dfb pokal', 'coppa italia', 'league cup', 'super cup'];
const TIER_5_POPULAR_COUNTRIES = ['brazil', 'argentina', 'mexico', 'usa', 'saudi arabia'];
const TIER_6_INTERNATIONAL = ['friendly', 'international', 'copa america', 'concacaf', 'afc', 'caf'];
const TIER_7_MAJOR_SOUTH_AMERICAN = ['libertadores', 'copa sudamericana'];

// Popular teams for boost weighting (365scores style)
const POPULAR_TEAMS = [
  // Premier League Top 6
  33, 42, 40, 39, 49, 48, // Arsenal, Chelsea, Liverpool, Man United, Man City, Tottenham
  // Spanish Giants
  529, 530, 541, // Barcelona, Atletico Madrid, Real Madrid
  // Italian Giants
  497, 505, 157, 165, // AC Milan, Inter, Juventus, Napoli
  // German/French
  157, 529, // Bayern Munich, PSG
];

export const NewMatchCardFilter = ({ fixtures, onMatchClick }: NewMatchCardFilterProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [localSelectedDate, setLocalSelectedDate] = useState(getCurrentUTCDateString());
  const [allFixtures, setAllFixtures] = useState<FixtureResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch fixtures for the selected date
  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', `/api/fixtures/date/${localSelectedDate}`);
        const data = await response.json();
        setAllFixtures(data);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();
  }, [localSelectedDate]);

  // 365scores.com style filtering logic
  const apply365scoresFiltering = (matches: FixtureResponse[]): FixtureResponse[] => {
    const currentTime = Math.floor(Date.now() / 1000);

    // Step 1: Filter by competition tiers
    const filteredMatches = matches.filter(match => {
      if (!match.league || !match.teams) return false;

      const leagueName = match.league.name?.toLowerCase() || '';
      const countryName = match.league.country?.toLowerCase() || '';

      // Tier 1 - Elite European Competitions (Always show)
      if (TIER_1_COMPETITIONS.includes(match.league.id)) {
        return true;
      }

      // Tier 2 - Top 5 Leagues (High priority)
      if (TIER_2_TOP_LEAGUES.includes(match.league.id)) {
        // Special handling for Premier League - must be from England
        if (match.league.id === 39) {
          return match.league.country?.toLowerCase() === 'england';
        }
        return true;
      }

      // Tier 3 - Other Major European Leagues
      if (TIER_3_MAJOR_EUROPEAN.some(league => 
        leagueName.includes(league))) {
        return true;
      }

      // Tier 4 - Major Cups & Important Matches
      if (TIER_4_MAJOR_CUPS.some(cup => 
        leagueName.includes(cup))) {
        return true;
      }

      // Tier 5 - Popular Non-European Leagues
      if (match.league.country && TIER_5_POPULAR_COUNTRIES.includes(countryName)) {
        return true;
      }

      // Tier 6 - International Friendlies and Competitions
      if (TIER_6_INTERNATIONAL.some(comp => leagueName.includes(comp))) {
        return true;
      }

      // Tier 7 - South American Major Competitions
      if (TIER_7_MAJOR_SOUTH_AMERICAN.some(comp => leagueName.includes(comp))) {
        return true;
      }

      // Special case: Include live matches from any decent league
      if (isLiveMatch(match.fixture.status.short)) {
        return true;
      }

      return false;
    });

    // Step 2: Apply exclusion filters
    const excludedFiltered = filteredMatches.filter(match => {
      const leagueName = match.league?.name || '';
      const homeTeamName = match.teams?.home?.name || '';
      const awayTeamName = match.teams?.away?.name || '';
      const country = match.league?.country || null;

      return !shouldExcludeFixture(leagueName, homeTeamName, awayTeamName, country);
    });

    // Step 3: 365scores priority sorting
    return excludedFiltered.sort((a, b) => {
      // Priority 1: Live matches
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // Priority 2: Starting soon (within next hour)
      const aStartingSoon = a.fixture.timestamp - currentTime < 3600 && a.fixture.timestamp > currentTime;
      const bStartingSoon = b.fixture.timestamp - currentTime < 3600 && b.fixture.timestamp > currentTime;
      if (aStartingSoon && !bStartingSoon) return -1;
      if (!aStartingSoon && bStartingSoon) return 1;

      // Priority 3: Popular team boost
      const aHasPopularTeam = POPULAR_TEAMS.includes(a.teams.home.id) || POPULAR_TEAMS.includes(a.teams.away.id);
      const bHasPopularTeam = POPULAR_TEAMS.includes(b.teams.home.id) || POPULAR_TEAMS.includes(b.teams.away.id);
      if (aHasPopularTeam && !bHasPopularTeam) return -1;
      if (!aHasPopularTeam && bHasPopularTeam) return 1;

      // Priority 4: Recently finished (within last 2 hours)
      const aRecentlyFinished = a.fixture.status.short === 'FT' && currentTime - a.fixture.timestamp < 7200;
      const bRecentlyFinished = b.fixture.status.short === 'FT' && currentTime - b.fixture.timestamp < 7200;
      if (aRecentlyFinished && !bRecentlyFinished) return -1;
      if (!aRecentlyFinished && bRecentlyFinished) return 1;

      // Priority 5: Competition tier (Champions League > Europa League > Top Leagues > Others)
      const getCompetitionPriority = (leagueId: number) => {
        if (leagueId === 2) return 1; // Champions League
        if (leagueId === 3) return 2; // Europa League
        if (TIER_2_TOP_LEAGUES.includes(leagueId)) return 3; // Top 5 leagues
        return 4; // Others
      };

      const aTier = getCompetitionPriority(a.league.id);
      const bTier = getCompetitionPriority(b.league.id);
      if (aTier !== bTier) return aTier - bTier;

      // Finally sort by match time
      return a.fixture.timestamp - b.fixture.timestamp;
    });
  };

  // Apply filtering based on current filters
  const filteredFixtures = useMemo(() => {
    if (!allFixtures?.length) return [];

    let filtered = apply365scoresFiltering(allFixtures);

    // Apply live filter
    if (liveFilterActive) {
      filtered = filtered.filter(match => isLiveMatch(match.fixture.status.short));
    }

    // Apply time filter (show matches starting within 8 hours)
    if (timeFilterActive) {
      const currentTime = Math.floor(Date.now() / 1000);
      filtered = filtered.filter(match => {
        const hoursToMatch = (match.fixture.timestamp - currentTime) / 3600;
        return hoursToMatch >= -2 && hoursToMatch <= 8; // 2 hours ago to 8 hours from now
      });
    }

    // Limit to 20 matches max (365scores style)
    console.log(`365scores filtering: ${matches.length} total -> ${filtered.length} after filtering`);
    return filtered.slice(0, 20);
  }, [allFixtures, liveFilterActive, timeFilterActive]);

  // Date navigation handlers
  const goToPreviousDay = () => {
    const newDate = format(subDays(parseISO(localSelectedDate), 1), 'yyyy-MM-dd');
    setLocalSelectedDate(newDate);
    setSelectedFilter(getRelativeDateDisplayName(newDate));
  };

  const goToNextDay = () => {
    const newDate = format(addDays(parseISO(localSelectedDate), 1), 'yyyy-MM-dd');
    setLocalSelectedDate(newDate);
    setSelectedFilter(getRelativeDateDisplayName(newDate));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selectedDateString = formatYYYYMMDD(date);
      setLocalSelectedDate(selectedDateString);
      setSelectedFilter(getRelativeDateDisplayName(selectedDateString));
      setIsCalendarOpen(false);
    }
  };

  const goToToday = () => {
    const today = getCurrentUTCDateString();
    setLocalSelectedDate(today);
    setSelectedFilter("Today's Matches");
    setIsCalendarOpen(false);
  };

  // Render match card
  const renderMatchCard = (match: FixtureResponse) => (
    <div 
      key={match.fixture.id} 
      className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={() => onMatchClick(match.fixture.id)}
    >
      <div className="flex items-center space-x-3 flex-1">
        {/* Competition logo */}
        <div className="w-6 h-6 flex-shrink-0">
          {match.league.logo && (
            <img 
              src={match.league.logo} 
              alt={match.league.name}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Teams */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={match.teams.home.logo || '/assets/fallback-logo.png'} 
                alt={match.teams.home.name}
                className="w-5 h-5 object-contain"
              />
              <span className="text-sm font-medium">{match.teams.home.name}</span>
            </div>
            {match.goals && (
              <span className="text-sm font-bold">{match.goals.home}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-2">
              <img 
                src={match.teams.away.logo || '/assets/fallback-logo.png'} 
                alt={match.teams.away.name}
                className="w-5 h-5 object-contain"
              />
              <span className="text-sm font-medium">{match.teams.away.name}</span>
            </div>
            {match.goals && (
              <span className="text-sm font-bold">{match.goals.away}</span>
            )}
          </div>
        </div>

        {/* Status/Time */}
        <div className="text-right text-xs text-gray-500 min-w-[60px]">
          {isLiveMatch(match.fixture.status.short) ? (
            <span className="text-red-500 font-bold">LIVE</span>
          ) : match.fixture.status.short === 'FT' ? (
            <span className="text-gray-600">FT</span>
          ) : (
            <span>{format(new Date(match.fixture.date), 'HH:mm')}</span>
          )}
        </div>
      </div>
    </div>
  );

  console.log('NewMatchCardFilter - Filtered fixtures:', filteredFixtures.length);
  console.log('NewMatchCardFilter - Live filter:', liveFilterActive, 'Time filter:', timeFilterActive);

  return (
    <>
      <Card className="shadow-md w-full">
        <div className="flex items-center justify-between h-9 p-4">
          <button 
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-r-full flex items-center -ml-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="relative h-full flex items-center">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md h-full"
            >
              <span className="font-medium">{selectedFilter}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCalendarOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[320px]">
                <Calendar
                  mode="single"
                  selected={localSelectedDate ? parseISO(localSelectedDate) : new Date()}
                  onSelect={handleDateSelect}
                  className="w-full"
                />
                <div className="flex justify-center pt-3 border-t mt-3">
                  <button
                    onClick={goToToday}
                    className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors px-4 py-1 hover:bg-blue-50 rounded"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 rounded-l-full flex items-center -mr-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between px-4 pb-4 mt-[20px] text-[110.25%] h-9">
          {/* Live button */}
          <button 
            onClick={() => {
              setLiveFilterActive(!liveFilterActive);
              setTimeFilterActive(false);
            }}
            className={`flex items-center justify-center gap-1 px-0.5 py-0.5 rounded-full text-xs font-medium w-fit transition-colors duration-200 ${
              liveFilterActive 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`} 
            style={{minWidth: 'calc(2rem + 15px)'}}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveFilterActive ? 'bg-white' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveFilterActive ? 'bg-white' : 'bg-red-500'}`}></span>
            </span>
            Live
          </button>

          {/* Spacer */}
          <div className="flex items-center gap-2"></div>

          {/* By time button */}
          <button 
            onClick={() => {
              setTimeFilterActive(!timeFilterActive);
              setLiveFilterActive(false);
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
              timeFilterActive 
                ? 'bg-gray-400 text-black hover:bg-gray-500' 
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            By time
          </button>
        </div>
      </Card>

      {/* Matches List */}
      <Card className="shadow-md w-full mt-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              365scores Style Matches
              {liveFilterActive && ' - Live'}
              {timeFilterActive && ' - By Time'}
            </h3>
            <span className="text-sm text-gray-500">
              {filteredFixtures.length} matches
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading matches...</div>
          ) : filteredFixtures.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              {filteredFixtures.map(renderMatchCard)}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No matches found for {selectedFilter}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default NewMatchCardFilter;
