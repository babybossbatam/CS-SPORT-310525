import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import { safeSubstring } from '@/lib/dateUtilsUpdated';
import { shouldExcludeMatchByCountry } from '@/lib/MyMatchByCountryNewExclusion';
import { isToday, isYesterday, isTomorrow } from '@/lib/dateUtilsUpdated';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, fixturesActions, selectFixturesByDate } from '@/lib/store';
import { 
  formatYYYYMMDD, 
  getCurrentUTCDateString, 
  getCurrentClientDateString,
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureOnClientDate,
  getFixtureClientDate,
  isFixtureDateTimeStringToday,
  isFixtureDateTimeStringYesterday,
  isFixtureDateTimeStringTomorrow,
  getDateTimeRange
} from '@/lib/dateUtilsUpdated';
import { getCachedFlag, getCountryFlagWithFallbackSync, clearFallbackFlagCache, countryCodeMap, flagCache } from '@/lib/flagUtils';
import { getCachedFixturesForDate, cacheFixturesForDate } from '@/lib/fixtureCache';
import { getCachedCountryName, setCachedCountryName } from '@/lib/countryCache';

interface TodaysMatchesByCountryNewProps {
  selectedDate: string;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const TodaysMatchesByCountryNew: React.FC<TodaysMatchesByCountryNewProps> = ({ 
  selectedDate, 
  liveFilterActive = false, 
  timeFilterActive = false 
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [enableFetching, setEnableFetching] = useState(true);
  // Initialize flagMap with immediate synchronous values for better rendering
  const [flagMap, setFlagMap] = useState<{ [country: string]: string }>(() => {
    // Pre-populate with synchronous flag URLs to prevent initial undefined state
    const initialMap: { [country: string]: string } = {};
    // Let World flag be fetched through the normal caching system
    return initialMap;
  });

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 15, 39, 140, 135, 78, 848]; // Champions League, Europa League, FIFA Club World Cup, Premier League, La Liga, Serie A, Bundesliga, Conference League

  // Always call hooks in the same order - validate after hooks
  // Fetch all fixtures for the selected date with comprehensive caching
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async ()=> {
      console.log(`🔍 [TodaysMatchesByCountryNew] Checking cache for date: ${selectedDate}`);

      // Check our custom cache first
      const cachedFixtures = getCachedFixturesForDate(selectedDate);
      if (cachedFixtures) {
        console.log(`✅ [TodaysMatchesByCountryNew] Using cached fixtures: ${cachedFixtures.length} matches`);

        // Detailed API data analysis
        const apiAnalysis = {
          totalFixtures: cachedFixtures.length,
          countries: [...new Set(cachedFixtures.map(f => f.league?.country).filter(Boolean))].length,
          leagues: [...new Set(cachedFixtures.map(f => f.league?.name).filter(Boolean))].length,
          statuses: [...new Set(cachedFixtures.map(f => f.fixture?.status?.short).filter(Boolean))],
          dateRange: {
            earliest: cachedFixtures.reduce((min, f) => f.fixture?.date < min ? f.fixture.date : min, cachedFixtures[0]?.fixture?.date || ''),
            latest: cachedFixtures.reduce((max, f) => f.fixture?.date > max ? f.fixture.date : max, cachedFixtures[0]?.fixture?.date || '')
          },
          sampleFixtures: cachedFixtures.slice(0, 5).map(f => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`
          }))
        };

        console.log(`📊 [DEBUG] API Data Analysis:`, apiAnalysis);
        return cachedFixtures;
      }

      console.log(`📡 [TodaysMatchesByCountryNew] Fetching fresh data for date: ${selectedDate}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();

      // Cache the fetched data
      if (data && Array.isArray(data)) {
        cacheFixturesForDate(selectedDate, data, 'api');
        console.log(`💾 [TodaysMatchesByCountryNew] Cached ${data.length} fixtures for ${selectedDate}`);

        // Detailed API data analysis for fresh data
        const apiAnalysis = {
          totalFixtures: data.length,
          countries: [...new Set(data.map(f => f.league?.country).filter(Boolean))].length,
          leagues: [...new Set(data.map(f => f.league?.name).filter(Boolean))].length,
          statuses: [...new Set(data.map(f => f.fixture?.status?.short).filter(Boolean))],
          dateRange: {
            earliest: data.reduce((min, f) => f.fixture?.date < min ? f.fixture.date : min, data[0]?.fixture?.date || ''),
            latest: data.reduce((max, f) => f.fixture?.date > max ? f.fixture.date : max, data[0]?.fixture?.date || '')
          },
          sampleFixtures: data.slice(0, 5).map(f => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`
          }))
        };

        console.log(`📊 [DEBUG] Fresh API Data Analysis:`, apiAnalysis);
      }

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for live data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Now validate after all hooks are called
  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Please select a valid date</p>
        </CardContent>
      </Card>
    );
  }

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());
  }, [selectedDate]);

  // Country code to full name mapping with caching
  const getCountryDisplayName = (country: string | null | undefined): string => {
    if (!country || typeof country !== 'string' || country.trim() === '') {
      return 'Unknown';
    }

    // Check cache first
    const cachedName = getCachedCountryName(country);
    if (cachedName) {
      return cachedName;
    }

    // Create reverse mapping from country code to country name using the centralized countryCodeMap
    const countryNameMap: { [key: string]: string } = {};
    Object.entries(countryCodeMap).forEach(([countryName, countryCode]) => {
      if (countryCode.length === 2) {
        countryNameMap[countryCode.toLowerCase()] = countryName;
      }
    });

    // Additional mappings for common variations and full country names from API
    const additionalMappings: { [key: string]: string } = {
      'czech republic': 'Czech-Republic',
      'india': 'India',
      'ae': 'United Arab Emirates',
      'united arab emirates': 'United Arab Emirates',
      'united arab emirates (the)': 'United Arab Emirates',
      'uae': 'United Arab Emirates',
      'ba': 'Bosnia & Herzegovina',
      'mk': 'North Macedonia',
      'sa': 'Saudi Arabia',
      'saudi arabia': 'Saudi Arabia',
      'gb': 'United Kingdom',
      'gbr': 'United Kingdom', 
      'united kingdom': 'United Kingdom',
      'united kingdom of great britain and northern ireland': 'United Kingdom',
      'united kingdom of great britain and northern ireland (the)': 'United Kingdom',
      'us': 'United States',
      'usa': 'United States',
      'united states': 'United States',
      'united states of america': 'United States',
      'united states minor outlying islands': 'United States',
      'united states minor outlying islands (the)': 'United States',
      'um': 'United States',
      'umi': 'United States',
      'korea republic': 'South Korea',
      'korea (republic of)': 'South Korea',
      'korea democratic people\'s republic': 'North Korea',
      'korea (democratic people\'s republic of)': 'North Korea',
      'iran islamic republic': 'Iran',
      'iran (islamic republic of)': 'Iran',
      'russian federation': 'Russia',
      'russian federation (the)': 'Russia',
      'venezuela bolivarian republic': 'Venezuela',
      'venezuela (bolivarian republic of)': 'Venezuela',
      'bolivia plurinational state': 'Bolivia',
      'bolivia (plurinational state of)': 'Bolivia',
      'tanzania united republic': 'Tanzania',
      'tanzania (united republic of)': 'Tanzania',
      'moldova republic': 'Moldova',
      'moldova (republic of)': 'Moldova',
      'macedonia former yugoslav republic': 'North Macedonia',
      'macedonia (the former yugoslav republic of)': 'North Macedonia',
      'palestinian territory occupied': 'Palestine',
      'palestinian territory (occupied)': 'Palestine',
      'palestine state': 'Palestine',
      'palestine (state of)': 'Palestine',
      'congo democratic republic': 'Democratic Republic of Congo',
      'congo (the democratic republic of the)': 'Democratic Republic of Congo',
      'lao people\'s democratic republic': 'Laos',
      'lao people\'s democratic republic (the)': 'Laos'
    };

    const cleanCountry = country.trim().toLowerCase();
    const displayName = countryNameMap[cleanCountry] || additionalMappings[cleanCountry] || country;

    // Cache the result for future use
    setCachedCountryName(country, displayName, 'country-mapping');

    return displayName;
  };

  // Helper function to convert UTC date to user's local date
  const getFixtureLocalDate = (utcDateString: string): string => {
    const utcDate = parseISO(utcDateString);
    return format(utcDate, 'yyyy-MM-dd');
  };

  // Client timezone-aware date filtering
  const allFixtures = fixtures.filter((fixture: any) => {
    if (!fixture?.fixture?.date) {
      console.log(`❌ [DEBUG] Filtering out fixture with no date:`, fixture.fixture?.id);
      return false;
    }

    try {
      // Convert UTC fixture time to client timezone and check if it matches selected date
      const passes = isFixtureOnClientDate(fixture.fixture.date, selectedDate);

      if (!passes) {
        const fixtureClientDate = getFixtureClientDate(fixture.fixture.date);
        console.log(`❌ [DEBUG] Date mismatch (client timezone):`, {
          fixtureId: fixture.fixture.id,
          fixtureUTCDate: fixture.fixture.date,
          fixtureClientDate,
          selectedDate,
          status: fixture.fixture.status?.short
        });
      } else {
        console.log(`✅ [DEBUG] Date match (client timezone):`, {
          fixtureId: fixture.fixture.id,
          fixtureUTCDate: fixture.fixture.date,
          fixtureClientDate: getFixtureClientDate(fixture.fixture.date),
          selectedDate,
          status: fixture.fixture.status?.short
        });
      }

      return passes;
    } catch (error) {
      console.warn('❌ [DEBUG] Date validation error for fixture:', fixture.fixture.id, error);
      return false;
    }
  });

  // Comprehensive filtering analysis
  const filterAnalysis = {
    selectedDate,
    originalCount: fixtures.length,
    filteredCount: allFixtures.length,
    removedCount: fixtures.length - allFixtures.length,
    removedFixtures: fixtures.filter(f => !allFixtures.includes(f)).slice(0, 10).map(f => ({
      id: f.fixture?.id,
      date: f.fixture?.date,
      status: f.fixture?.status?.short,
      league: f.league?.country,
      country: f.league?.country,
      teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
      reason: 'Date mismatch'
    })),
    statusBreakdown: {
      original: [...new Set(fixtures.map(f => f.fixture?.status?.short).filter(Boolean))],
      filtered: [...new Set(allFixtures.map(f => f.fixture?.status?.short).filter(Boolean))]
    },
    dateBreakdown: {
      original: [...new Set(fixtures.map(f => f.fixture?.date?.split('T')[0]).filter(Boolean))],
      filtered: [...new Set(allFixtures.map(f => f.fixture?.date?.split('T')[0]).filter(Boolean))]
    }
  };

  console.log(`📊 [DEBUG] Comprehensive Filtering Analysis:`, filterAnalysis);

  // Group fixtures by country and league with comprehensive null checks
  const fixturesByCountry = allFixtures.reduce((acc: any, fixture: any) => {
    // Validate fixture structure
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      console.warn('❌ [DEBUG] Invalid fixture data structure:', fixture);
      return acc;
    }

    // Validate league data
    const league = fixture.league;
    if (!league.id || !league.name) {
      console.warn('❌ [DEBUG] Invalid league data:', league);
      return acc;
    }

    // Validate team data
    if (!fixture.teams.home || !fixture.teams.away ||
      !fixture.teams.home.name || !fixture.teams.away.name) {
      console.warn('❌ [DEBUG] Invalid team data:', fixture.teams);
      return acc;
    }

    // Apply universal exclusion filters for unknown and regional leagues
    const leagueName = league.name || '';
    const homeTeamName = fixture.teams?.home?.name || '';
    const awayTeamName = fixture.teams?.away?.name || '';
    const countryName = league.country || '';

    // Note: Unknown leagues and regional leagues are now allowed through
    // Only applying main exclusion filters (women's, esports, etc.)

    // Apply standard exclusion filters (women's, youth, etc.)
    const shouldExclude = shouldExcludeMatchByCountry(leagueName, homeTeamName, awayTeamName, false, countryName);
    if (shouldExclude) {
      console.log(`🚫 [DEBUG] Excluding match by standard filters:`, {
        fixtureId: fixture.fixture.id,
        league: leagueName,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        country: countryName,
        reason: 'Standard exclusion filters'
      });
      return acc;
    }

    const country = league.country;
    const displayCountry = getCountryDisplayName(country);

    // Skip fixtures without a valid country, but keep World and Europe competitions
    if (!country ||
      country === null ||
      country === undefined ||
      typeof country !== 'string' ||
      country.trim() === '' ||
      country.toLowerCase() === 'unknown') {
      console.warn('❌ [DEBUG] Skipping fixture with invalid/unknown country:', country, fixture.fixture.id);
      return acc;
    }

    // Allow valid country names, World, Europe, and various country name formats
    const validCountry = country.trim();
    if (validCountry.length === 0) {
      console.warn('❌ [DEBUG] Skipping fixture with empty country name:', country, fixture.fixture.id);
      return acc;
    }

    // Accept all non-empty country names (including long official names)
    // The getCountryDisplayName function will handle the mapping

    const leagueId = league.id;

    if (!acc[displayCountry]) {
      console.log(`🆕 [DEBUG] Creating new country group:`, {
        originalCountry: country,
        displayCountry,
        fixtureId: fixture.fixture.id,
        league: leagueName
      });
      acc[displayCountry] = {
        country: displayCountry,
        flag: '',
        leagues: {},
        hasPopularLeague: POPULAR_LEAGUES.includes(leagueId)
      };
    }

    if (!acc[displayCountry].leagues[leagueId]) {
      console.log(`🆕 [DEBUG] Creating new league group:`, {
        country: displayCountry,
        leagueId,
        leagueName,
        fixtureId: fixture.fixture.id
      });
      acc[displayCountry].leagues[leagueId] = {
        league: {
          ...league,
          logo: league.logo || 'https://media.api-sports.io/football/leagues/1.png'
        },
        matches: [],
        isPopular: POPULAR_LEAGUES.includes(leagueId)
      };
    }

    // Add fixture with safe team data
    acc[displayCountry].leagues[leagueId].matches.push({
      ...fixture,
      teams: {
        home: {
          ...fixture.teams.home,
          logo: fixture.teams.home.logo || '/assets/fallback-logo.png'
        },
        away: {
          ...fixture.teams.away,
          logo: fixture.teams.away.logo || '/assets/fallback-logo.png'
        }
      }
    });

    console.log(`✅ [DEBUG] Added match to country group:`, {
      country: displayCountry,
      league: leagueName,
      match: `${homeTeamName} vs ${awayTeamName}`,
      fixtureId: fixture.fixture.id,
      status: fixture.fixture.status?.short
    });

    return acc;
  }, {});

  // Final summary of grouped data with comprehensive analysis
  const countryStats = Object.entries(fixturesByCountry).map(([country, data]: [string, any]) => ({
    country,
    totalMatches: Object.values(data.leagues).reduce((sum: number, league: any) => sum + league.matches.length, 0),
    leagues: Object.keys(data.leagues).length,
    leagueNames: Object.values(data.leagues).map((l: any) => l.league.name),
    sampleMatches: Object.values(data.leagues).flatMap((l: any) => l.matches).slice(0, 3).map((m: any) => ({
      id: m.fixture?.id,
      date: m.fixture?.date,
      status: m.fixture?.status?.short,
      teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`
    }))
  }));

  const groupingAnalysis = {
    selectedDate,
    totalCountries: Object.keys(fixturesByCountry).length,
    totalMatches: countryStats.reduce((sum, c) => sum + c.totalMatches, 0),
    totalLeagues: countryStats.reduce((sum, c) => sum + c.leagues, 0),
    countriesWithMatches: countryStats.filter(c => c.totalMatches > 0).length,
    topCountries: countryStats.sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 5),
    pipeline: {
      step1_rawFixtures: fixtures.length,
      step2_dateFiltered: allFixtures.length,
      step3_countryGrouped: countryStats.reduce((sum, c) => sum + c.totalMatches, 0),
      step4_exclusionFiltered: countryStats.reduce((sum, c) => sum + c.totalMatches, 0)
    }
  };

  console.log(`📊 [DEBUG] Comprehensive Grouping Analysis:`, groupingAnalysis);

  // Sort countries alphabetically A-Z
  const sortedCountries = Object.values(fixturesByCountry).sort((a: any, b: any) => {
    const countryA = a.country || '';
    const countryB = b.country || '';
    return countryA.localeCompare(countryB);
  });

  // Single flag fetching effect with deduplication
  useEffect(() => {
    const countries = sortedCountries.map((c: any) => c.country).filter(Boolean);
    const uniqueCountries = [...new Set(countries)];

    // Only process countries that aren't already in flagMap
    const missingCountries = uniqueCountries.filter(country => !flagMap[country]);

    if (missingCountries.length === 0) {
      return;
    }

    console.log(`🎯 Need flags for ${missingCountries.length} countries: ${missingCountries.join(', ')}`);

    // Pre-populate flagMap with sync flags to prevent redundant calls
    const syncFlags: { [country: string]: string } = {};
    missingCountries.forEach(country => {
      const syncFlag = getCountryFlagWithFallbackSync(country);
      if (syncFlag) {
        syncFlags[country] = syncFlag;
      }
    });

    if (Object.keys(syncFlags).length > 0) {
      setFlagMap(prev => ({ ...prev, ...syncFlags }));
      console.log(`⚡ Pre-populated ${Object.keys(syncFlags).length} flags synchronously`);
    }
  }, [sortedCountries.length]); // Only depend on count, not the specific countries



  const toggleCountry = (country: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) {
      newExpanded.delete(country);
    } else {
      newExpanded.add(country);
    }
    setExpandedCountries(newExpanded);
  };

  // Enhanced match status logic
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    // Finished matches
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      if (hoursAgo <= 2) return 'Just Finished';
      if (hoursAgo <= 24) return 'Recent';
      return status;
    }

    // Live matches
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'Half Time' : 'LIVE';
    }

    // Upcoming matches
    if (fixtureDate < now && status === 'NS') {
      return 'Delayed';
    }

    return 'Scheduled';
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      if (hoursAgo <= 2) return 'bg-green-100 text-green-700 font-semibold';
      return 'bg-gray-100 text-gray-700 font-semibold';
    }

    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 'bg-red-100 text-red-700 font-semibold animate-pulse';
    }

    if (fixtureDate < now && status === 'NS') {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-blue-100 text-blue-700';
  };

  // Get header title based on button states and selected date (client timezone aware)
  const getHeaderTitle = () => {
    // Check for different button states first
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (liveFilterActive && !timeFilterActive) {
      return "Live Football Scores";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }

    // Default behavior based on selected date (client timezone)
    const selectedDateObj = new Date(selectedDate);

    if (isDateStringToday(selectedDate)) {
      return "Today's Football Matches by Country";
    } else if (isDateStringYesterday(selectedDate)) {
      return "Yesterday's Football Results by Country";
    } else if (isDateStringTomorrow(selectedDate)) {
      return "Tomorrow's Football Matches by Country";
    } else {
      return `Football Matches - ${format(selectedDateObj, 'MMM d, yyyy')}`;
    }
  };

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  // Format the time for display in user's local timezone
  const formatMatchTime = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== 'string') return '--:--';

    try {
      // Parse UTC time and convert to user's local timezone automatically
      const utcDate = parseISO(dateString);
      if (!isValid(utcDate)) return '--:--';

      // format() automatically converts to user's local timezone
      return format(utcDate, 'HH:mm');
    } catch (error) {
      console.error('Error formatting match time:', error);
      return '--:--';
    }
  };

  const isMatchLive = (status: string | null | undefined, dateString: string | null | undefined) => {
    if (!status || !dateString) return false;

    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];

    // Check if status indicates live match
    if (liveStatuses.some(liveStatus => status.includes(liveStatus))) {
      return true;
    }

    // For "NS" (Not Started) status, check if match time is within reasonable live window
    if (status === 'NS') {
      try {
        const matchTime = new Date(dateString);
        const now = new Date();
        const diffInMinutes = (now.getTime() - matchTime.getTime()) / (1000 * 60);

        // Consider it live if it's within 15 minutes of start time
        return diffInMinutes >= 0 && diffInMinutes <= 15;
      } catch (error) {
        console.error('Error checking live match status:', error);
        return false;
      }
    }

    return false;
  };





  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col space-y-1.5 p-6 pt-[10px] pb-[10px] border-b border-stone-200">
        <h3 className="text-sm font-semibold">
          {getHeaderTitle()}
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          {/* Use sortedCountries directly */}
          {
            sortedCountries.map((countryData: any) => {
              const isExpanded = expandedCountries.has(countryData.country);
              const totalMatches = Object.values(countryData.leagues).reduce(
                (sum: number, league: any) => sum + league.matches.length, 0
              );

              // Count live and recent matches for badge
              const liveMatches = Object.values(countryData.leagues).reduce((count: number, league: any) => {
                return count + league.matches.filter((match: any) =>
                  ['LIVE', '1H', 'HT', '2H', 'ET'].includes(match.fixture.status.short)
                ).length;
              }, 0);

              const recentMatches = Object.values(countryData.leagues).reduce((count: number, league: any) => {
                return count + league.matches.filter((match: any) => {
                  const status = match.fixture.status.short;
                  const hoursAgo = differenceInHours(new Date(), new Date(match.fixture.date));
                  return ['FT', 'AET', 'PEN'].includes(status) && hoursAgo <= 3;
                }).length;
              }, 0);

              return (
                <div key={countryData.country} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={() => toggleCountry(countryData.country)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors pt-[12px] pb-[12px] font-normal text-[14px]"
                  >
                    <div className="flex items-center gap-3 font-normal text-[14px]">
                      <img
                        src={(() => {
                          if (countryData.country === 'World') {
                            return '/assets/world flag_new.png';
                          }

                          // For England specifically, always use the England flag
                          if (countryData.country === 'England') {
                            return 'https://flagcdn.com/w40/gb-eng.png';
                          }

                          // Check if we have a cached flag for other countries
                          const cachedFlag = flagMap[countryData.country];
                          if (cachedFlag) {
                            return cachedFlag;
                          }

                          // For other countries, use the fallback sync function
                          return getCountryFlagWithFallbackSync(countryData.country) || '/assets/fallback-logo.svg';
                        })()}
                        alt={countryData.country}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // For World flag, use fallback
                            if (countryData.country === 'World') {
                              target.src = '/assets/fallback-logo.svg';
                              return;
                            }
                            // For England specifically, ensure we try the correct flag first
                            if (countryData.country === 'England' && !target.src.includes('fallback-logo.svg')) {
                              if (!target.src.includes('gb-eng')) {
                                // First try the England flag
                                target.src = 'https://flagcdn.com/w40/gb-eng.png';
                                return;
                              } else {
                                // If England flag fails, use GB flag
                                target.src = 'https://flagcdn.com/w40/gb.png';
                                return;
                              }
                            }
                            // For other GB subdivisions
                            if ((countryData.country === 'Scotland' || countryData.country === 'Wales' || 
                                 countryData.country === 'Northern Ireland') && 
                                !target.src.includes('fallback-logo.svg')){
                              if (target.src.includes('gb-sct') || target.src.includes('gb-wls') || target.src.includes('gb-nir')) {
                                target.src = 'https://flagcdn.com/w40/gb.png'; // Fallback to GB flag
                              } else if (target.src.includes('/gb.png')) {
                                target.src = '/assets/fallback-logo.svg';
                              }
                              return;
                            }
                            if (!target.src.includes('/assets/fallback-logo.svg')) {
                              target.src = '/assets/fallback-logo.svg';
                            }
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">{countryData.country}</span>
                      <span className="text-xs text-gray-500">({totalMatches})</span>

                      {/* Live/Recent badges */}
                      {liveMatches > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold animate-pulse">
                          {liveMatches} LIVE
                        </span>
                      )}
                      {recentMatches > 0 && !liveMatches && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                          {recentMatches} Recent
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {/* Sort leagues - popular first */}
                      {Object.values(countryData.leagues)
                        .sort((a: any, b: any) => {
                          if (a.isPopular && !b.isPopular) return -1;
                          if (!a.isPopular && b.isPopular) return 1;
                          return a.league.name.localeCompare(b.league.name);
                        })
                        .map((leagueData: any) => (
                          <div key={leagueData.league.id} className="p-3 border-b border-gray-200 last:border-b-0">
                            {/* League Header */}
                            <div className="flex items-center gap-2 mb-0 py-2 px-4 bg-gray-50 border-b border-gray-200">
                              <img
                                src={leagueData.league.logo}
                                alt={leagueData.league.name}
                                className="w-4 h-4 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                                }}
                              />
                              <span className="font-medium text-sm text-gray-700">
                                {leagueData.league.name}
                              </span>
                              {leagueData.isPopular && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                                  Popular
                                </span>
                              )}
                            </div>

                            {/* Matches */}
                            <div className="space-y-0 mt-3">
                              {leagueData.matches
                                .sort((a: any, b: any) => {
                                  // Priority order: Live > Upcoming > Ended
                                  const aStatus = a.fixture.status.short;
                                  const bStatus = b.fixture.status.short;
                                  const aDate = new Date(a.fixture.date).getTime();
                                  const bDate = new Date(b.fixture.date).getTime();

                                  // Define status categories
                                  const aLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
                                  const bLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);

                                  const aUpcoming = aStatus === 'NS' && !aLive;
                                  const bUpcoming = bStatus === 'NS' && !bLive;

                                  const aEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(aStatus);
                                  const bEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(bStatus);

                                  // Assign priority scores (lower = higher priority)
                                  let aPriority = 0;
                                  let bPriority = 0;

                                  if (aLive) aPriority = 1;
                                  else if (aUpcoming) aPriority = 2;
                                  else if (aEnded) aPriority = 3;
                                  else aPriority = 4; // Other statuses

                                  if (bLive) bPriority = 1;
                                  else if (bUpcoming) bPriority = 2;
                                  else if (bEnded) bPriority = 3;
                                  else bPriority = 4; // Other statuses

                                  // First sort by priority
                                  if (aPriority !== bPriority) {
                                    return aPriority - bPriority;
                                  }

                                  // If same priority, sort by time within category
                                  if (aLive && bLive) {
                                    // For live matches, show earliest start time first
                                    return aDate - bDate;
                                  }

                                  if (aUpcoming && bUpcoming) {
                                    // For upcoming matches, show earliest start time first
                                    return aDate - bDate;
                                  }

                                  if (aEnded && bEnded) {
                                    // For ended matches, show most recent first
                                    return bDate - aDate;
                                  }

                                  // Default time-based sorting
                                  return aDate - bDate;
                                })
                                .map((match: any) => (
                                  <div
                                    key={match.fixture.id}
                                    className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    {/* Home Team - Fixed width to prevent overflow */}
                                    <div className="flex items-center px-3 py-2">
                                      {/* Home Team - Fixed width to prevent overflow */}
                                      <div className="text-right text-sm text-gray-900 w-[100px] pr-2 truncate flex-shrink-0">
                                        {match.teams.home.name}
                                      </div>

                                      <div className="flex-shrink-0 mx-1">
                                        <img 
                                          src={match.teams.home.logo || '/assets/fallback-logo.png'} 
                                          alt={match.teams.home.name}
                                          className={`w-9 h-9 ${
                                            // Apply ball effect to country flags in international competitions
                                            (countryData.country === 'World' || 
                                             countryData.country === 'Europe' || 
                                             countryData.country === 'South America' || 
                                             countryData.country === 'International' ||
                                             match.league?.name?.toLowerCase().includes('international') ||
                                             match.league?.name?.toLowerCase().includes('friendlies') ||
                                             match.league?.name?.toLowerCase().includes('nations league') ||
                                             match.league?.name?.toLowerCase().includes('world cup') ||
                                             match.league?.name?.toLowerCase().includes('euro') ||
                                             match.league?.name?.toLowerCase().includes('copa america') ||
                                             match.league?.name?.toLowerCase().includes('uefa') ||
                                             match.league?.name?.toLowerCase().includes('conmebol') ||
                                             match.league?.name?.toLowerCase().includes('fifa'))
                                              ? 'object-cover country-flag-ball rounded-full' 
                                              : 'object-contain'
                                          }`}
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (target.src !== '/assets/fallback-logo.png') {
                                              target.src = '/assets/fallback-logo.png';
                                            }
                                          }}
                                        />
                                      </div>

                                      {/* Score/Time Center */}
                                      <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                                        {(() => {
                                          const status = match.fixture.status.short;
                                          const fixtureDate = parseISO(match.fixture.date);
                                          const matchDate = safeSubstring(match.fixture.date, 0, 10);

                                          // Live matches
                                          if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
                                            return (
                                              <>
                                                <div className="text-xs text-red-600 font-semibold mb-1 animate-pulse">
                                                  LIVE
                                                </div>
                                                <div className="text-lg font-bold text-red-600 flex items-center gap-2">
                                                  <span>{match.goals.home ?? 0}</span>
                                                  <span className="text-gray-400">-</span>
                                                  <span>{match.goals.away ?? 0}</span>
                                                </div>
                                                <div className="text-xs text-red-600 font-semibold mt-1 animate-pulse">
                                                  {status === 'HT' ? 'HT' : `${match.fixture.status.elapsed || 0}'`}
                                                </div>
                                              </>
                                            );
                                          }                                          // All finished match statuses
                                          if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
                                            // Check if we have actual numerical scores
                                            const homeScore = match.goals.home;
                                            const awayScore = match.goals.away;
                                            const hasValidScores = (homeScore !== null && homeScore !== undefined) &&
(awayScore !== null && awayScore !== undefined) &&
                                              !isNaN(Number(homeScore)) && !isNaN(Number(awayScore));

                                            if (hasValidScores) {
                                              return (
                                                <>
                                                  <div className="text-xs text-gray-600 font-semibold mb-1">
                                                    {status === 'FT' ? 'ENDED' : status}
                                                  </div>
                                                  <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                    <span>{homeScore}</span>
                                                    <span className="text-gray-400">-</span>
                                                    <span>{awayScore}</span>
                                                  </div>
                                                  <div className="text-xs text-gray-500 mt-1">
                                                    {status === 'FT' ? 'FT' : status}
                                                  </div>
                                                </>
                                              );
                                            } else {
                                              // Match is finished but no valid score data
                                              const statusText = status === 'FT' ? 'No Score Available' :
                                                status === 'CANC' ? 'Cancelled' :
                                                  status === 'ABD' ? 'Abandoned' :
                                                    status === 'SUSP' ? 'Suspended' : 'No Score';

                                              return (
                                                <>
                                                  <div className="text-sm font-medium text-orange-600 px-2 py-1 bg-orange-100 rounded text-center">
                                                    {statusText}
                                                                                 </div>
                                                  <div className="text-xs text-gray-500 mt-1">
                                                    {format(fixtureDate, 'HH:mm')}
                                                  </div>
                                                </>
                                              );
                                            }
                                          }

                                          // Postponed or delayed matches
                                          if (['PST', 'CANC', 'ABD', 'SUSP', 'AWD', 'WO'].includes(status)) {
                                            const statusText = status === 'PST' ? 'Postponed' :
                                              status === 'CANC' ? 'Cancelled' :
                                                status === 'ABD' ? 'Abandoned' :
                                                  status === 'SUSP' ? 'Suspended' :
                                                    status === 'AWD' ? 'Awarded' :
                                                      status === 'WO' ? 'Walkover' : status;

                                            return (
                                              <>
                                                <div className="text-sm font-medium text-red-600 px-2 py-1 bg-red-100 rounded text-center">
                                                  {statusText}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {format(fixtureDate, 'HH:mm')}
                                                </div>
                                              </>
                                            );
                                          }

                                          // Upcoming matches (NS = Not Started, TBD = ToBe Determined)
                                          return (
                                            <>
                                              <div className="text-sm font-medium text-black">
                                                {status === 'TBD' ? 'TBD' : format(fixtureDate, 'HH:mm')}
                                              </div>
                                              {status === 'TBD' && (
                                                <div className="text-xs text-gray-500 mt-1">Time TBD</div>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>

                                      <div className="flex-shrink-0 mx-1">
                                        <img
                                          src={match.teams.away.logo || '/assets/fallback-logo.png'}
                                          alt={match.teams.away.name}
                                          className={`w-9 h-9 ${
                                            // Apply ball effect to country flags in international competitions
                                            (countryData.country === 'World' || 
                                             countryData.country === 'Europe' || 
                                             countryData.country === 'South America' || 
                                             countryData.country === 'International' ||
                                             match.league?.name?.toLowerCase().includes('international') ||
                                             match.league?.name?.toLowerCase().includes('friendlies') ||
                                             match.league?.name?.toLowerCase().includes('nations league') ||
                                             match.league?.name?.toLowerCase().includes('world cup') ||
                                             match.league?.name?.toLowerCase().includes('euro') ||
                                             match.league?.name?.toLowerCase().includes('copa america') ||
                                             match.league?.name?.toLowerCase().includes('uefa') ||
                                             match.league?.name?.toLowerCase().includes('conmebol') ||
                                             match.league?.name?.toLowerCase().includes('fifa'))
                                              ? 'object-cover country-flag-ball rounded-full'
                                              : 'object-contain'
                                          }`}
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (target.src !== '/assets/fallback-logo.png') {
                                              target.src = '/assets/fallback-logo.png';
                                            }
                                          }}
                                        />
                                      </div>

                                      {/* Away Team - Fixed width to prevent overflow */}
                                      <div className="text-left text-sm text-gray-900 w-[100px] pl-2 truncate flex-shrink-0">
                                        {match.teams.away.name}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMatchesByCountryNew;