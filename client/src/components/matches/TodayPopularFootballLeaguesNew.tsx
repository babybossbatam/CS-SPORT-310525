import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours, isToday, isYesterday, isTomorrow, subDays, addDays } from 'date-fns';
import { safeSubstring } from '@/lib/dateUtilsUpdated';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { QUERY_CONFIGS, CACHE_FRESHNESS } from '@/lib/cacheConfig';
import { useCachedQuery, CacheManager } from '@/lib/cachingHelper';
import { getCurrentUTCDateString } from '@/lib/dateUtilsTodayMatch';
import { getCountryFlagWithFallback } from '../../lib/flagUtils';
import { createFallbackHandler } from '../../lib/MyAPIFallback';
import { DEFAULT_POPULAR_TEAMS, isPopularTeamMatch, applyPriorityFiltering } from '@/lib/matchFilters';


interface TodayPopularFootballLeaguesNewProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop20?: boolean;
  liveFilterActive?: boolean;
}

const TodayPopularFootballLeaguesNew: React.FC<TodayPopularFootballLeaguesNewProps> = ({ 
  selectedDate, 
  timeFilterActive = false, 
  showTop20 = false,
  liveFilterActive = false 
}) => {
  const [enableFetching, setEnableFetching] = useState(true);

  // Geographic/Regional preferences with priority tiers
  const TIER_1_COUNTRIES = ['England', 'Spain', 'Italy', 'Germany', 'France']; // Top priority European countries
  const TIER_2_INTERNATIONAL = ['World', 'Europe']; // International competitions
  const TIER_3_OTHER_POPULAR = ['Brazil', 'Saudi Arabia', 'Egypt', 'USA', 'United Arab Emirates']; // Other popular countries

  const POPULAR_COUNTRIES_ORDER = [
    'International', // FIFA Club World Cup first
    'World', // Men's international friendlies and other World competitions
    'Europe', // UEFA Europa Conference League and other European competitions
    'South America', // CONMEBOL competitions
    'Egypt', // Egypt Premier League
    'USA', // USA MLS league
    'United Arab Emirates', // UAE Pro League
    ...TIER_1_COUNTRIES.filter(c => c !== 'England' && c !== 'Spain' && c !== 'Italy' && c !== 'Germany' && c !== 'France'), // Remove duplicates if any
    'England', 'Spain', 'Italy', 'Germany', 'France', // Other European countries
    ...TIER_3_OTHER_POPULAR.filter(c => c !== 'Egypt' && c !== 'United Arab Emirates'), // Other popular countries except those already listed
  ];

  // Enhanced leagues by country with tier-based filtering
  const POPULAR_LEAGUES_BY_COUNTRY = {
    'England': [39, 45, 48], // Premier League, FA Cup, EFL Cup
    'Spain': [140, 143], // La Liga, Copa del Rey
    'Italy': [135, 137], // Serie A, Coppa Italia
    'Germany': [78, 81], // Bundesliga, DFB Pokal
    'France': [61, 66], // Ligue 1, Coupe de France
    'Brazil': [71, 72, 73, 74], // Serie A Brazil, Serie B Brazil, Serie C Brazil, Serie D Brazil
    'Saudi Arabia': [307], // Saudi Pro League (only major league)
    'Egypt': [233], // Egyptian Premier League (only major league)
    'USA': [253, 254], // Only Major League Soccer (MLS) and MLS Next Pro
    'United Arab Emirates': [301], // UAE Pro League
    'Europe': [2, 3, 848], // Champions League, Europa League, Conference League
    'World': [1, 10], // World Cup, Friendlies
    'South America': [9, 11, 13], // Copa America, Libertadores, Sudamericana
    'International': [15], // FIFA Club World Cup as separate category
  };

  // Flatten popular leagues for backward compatibility
  const POPULAR_LEAGUES = Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat();

  // Check if we have fresh cached data
  const fixturesQueryKey = ['all-fixtures-by-date', selectedDate];
  const popularQueryKey = ['popular-fixtures', selectedDate];

  const cachedFixtures = CacheManager.getCachedData(fixturesQueryKey, 30 * 60 * 1000); // 30 minutes
  const cachedPopularFixtures = CacheManager.getCachedData(popularQueryKey, 30 * 60 * 1000);

  // Fetch all fixtures for the selected date with smart caching
  const { data: fixtures = [], isLoading, isFetching } = useCachedQuery(
    fixturesQueryKey,
    async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();

      // Debug: Check first few fixtures' dates
      if (data.length > 0) {
        data.slice(0, 3).forEach((fixture, index) => {
          if (fixture?.fixture?.date) {
            const fixtureDate = parseISO(fixture.fixture.date);
            const fixtureDateString = format(fixtureDate, 'yyyy-MM-dd');
          }
        });
      }

      return data;
    },
    {
      enabled: !!selectedDate && enableFetching,
      maxAge: 30 * 60 * 1000, // 30 minutes
      backgroundRefresh: true,
    }
  );

  // Fetch popular league fixtures with smart caching and optimized loading
  const { data: popularFixtures = [], isLoading: isLoadingPopular, isFetching: isFetchingPopular } = useCachedQuery(
    popularQueryKey,
    async () => {

      // Split leagues into smaller batches for better performance
      const batchSize = 3;
      const leagueBatches = [];
      for (let i = 0; i < POPULAR_LEAGUES.length; i += batchSize) {
        leagueBatches.push(POPULAR_LEAGUES.slice(i, i + batchSize));
      }

      const allData = [];

      // Process batches in parallel for better performance
      for (const batch of leagueBatches) {
        const batchPromises = batch.map(async (leagueId) => {
          try {
            const response = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`);
            const leagueFixtures = await response.json();

            // Filter fixtures for the selected date with early returns for better performance
            const matchesFromSelectedDate = leagueFixtures.filter(match => {
              if (!match?.fixture?.date) return false;

              try {
                const fixtureDate = parseISO(match.fixture.date);
                if (!isValid(fixtureDate)) return false;

                // Use UTC date to avoid timezone issues
                const fixtureUTCDateString = format(fixtureDate, 'yyyy-MM-dd');

                // Ensure we're comparing the exact date strings
                const isMatch = fixtureUTCDateString === selectedDate;

                return isMatch;
              } catch (error) {
                return false;
              }
            });

            return matchesFromSelectedDate;
          } catch (error) {
            console.error(`Error fetching fixtures for league ${leagueId}:`, error);
            return [];
          }
        });

        // Wait for current batch to complete before processing next batch
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(matches => allData.push(...matches));
      }

      return allData;
    },
    {
      enabled: POPULAR_LEAGUES.length > 0 && !!selectedDate && enableFetching,
      maxAge: 45 * 60 * 1000, // Increased cache time to 45 minutes
      backgroundRefresh: true,
      staleTime: 30 * 60 * 1000, // Don't refetch for 30 minutes unless explicitly requested
    }
  );



  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;



  // Combine and deduplicate fixtures with better logging
  const allFixtures = [...fixtures, ...popularFixtures]
    .filter((fixture, index, self) => {
      const isUnique = index === self.findIndex(f => f.fixture.id === fixture.fixture.id);

      // Only keep fixtures that match the exact selected date
      if (isUnique && fixture?.fixture?.date) {
        try {
          const fixtureDate = parseISO(fixture.fixture.date);
          if (isValid(fixtureDate)) {
            const fixtureDateString = format(fixtureDate, 'yyyy-MM-dd');
            const matchesSelectedDate = fixtureDateString === selectedDate;

            if (!matchesSelectedDate) {

            }

            return matchesSelectedDate;
          }
        } catch (error) {
          console.error('Error parsing fixture date:', error);
          return false;
        }
      }

      return isUnique;
    });

  // Filter fixtures based on popular countries and exclusion filters
  const filteredFixtures = useMemo(() => {
    if (!allFixtures?.length) return [];

    const filtered = allFixtures.filter(fixture => {
      // Date filtering - ensure exact date match
      const fixtureDate = new Date(fixture.fixture.date);
      const expectedDate = new Date(selectedDate);

      const fixtureDateStr = format(fixtureDate, 'yyyy-MM-dd');
      const expectedDateStr = format(expectedDate, 'yyyy-MM-dd');

      if (fixtureDateStr !== expectedDateStr) {

        return false;
      }

      // Apply exclusion filters
      if (shouldExcludeFixture(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name
      )) {

        return false;
      }

      // Additional exclusions for popular leagues card
      const leagueName = fixture.league.name?.toLowerCase() || '';
      if (leagueName.includes('oberliga') || 
          leagueName.includes('usl w league') || 
          leagueName.includes('wpsl') ||
          leagueName.includes('npsl') ||
          leagueName.includes('national premier soccer league') ||
          leagueName.includes('usl league two') ||
          leagueName.includes('usl championship') ||
          leagueName.includes('usl league one') ||
          leagueName.includes('nwsl')) {
        return false;
      }

      // Extra USA filtering - if it's from USA and not MLS (253) or MLS Next Pro (254), exclude it
      if (fixture.league.country?.toLowerCase() === 'usa' || 
          fixture.league.country?.toLowerCase() === 'united states') {
        const allowedUSALeagues = [253, 254];
        if (!allowedUSALeagues.includes(fixture.league.id)) {
          return false;
        }
      }

      // Skip fixtures with null or undefined country
      if (!fixture.league.country) {
        return false;
      }

      // Enhanced geographic/regional filtering logic

      const countryName = fixture.league.country?.toLowerCase() || '';
      const leagueId = fixture.league.id;
      const leagueNameLower = fixture.league.name?.toLowerCase() || '';

      // Check for international competitions first (more permissive)
      // Prioritize men's international friendlies (exclude women's friendlies)
      const isWorldFriendlies = leagueNameLower.includes('friendlies') && 
                               countryName.includes('world') && 
                               !leagueNameLower.includes('women');

      // Enhanced CONMEBOL detection
      const isCONMEBOLCompetition = 
        leagueNameLower.includes('copa america') ||
        leagueNameLower.includes('copa libertadores') ||
        leagueNameLower.includes('copa sudamericana') ||
        leagueNameLower.includes('conmebol') ||
        leagueNameLower.includes('libertadores') ||
        leagueNameLower.includes('sudamericana') ||
        countryName.includes('south america') ||
        leagueId === 9 || leagueId === 11 || leagueId === 13; // Copa America, Libertadores, Sudamericana IDs

      // Enhanced international competitions detection
      const isInternationalCompetition = 
        leagueNameLower.includes('champions league') ||
        leagueNameLower.includes('europa league') ||
        leagueNameLower.includes('conference league') ||
        leagueNameLower.includes('world cup') ||
        leagueNameLower.includes('fifa club world cup') ||
        leagueNameLower.includes('fifa cup') ||
        leagueNameLower.includes('euro') ||
        leagueNameLower.includes('uefa') ||
        leagueNameLower.includes('fifa') ||
        leagueNameLower.includes('nations league') ||
        leagueNameLower.includes('intercontinental') ||
        leagueNameLower.includes('super cup') ||
        isWorldFriendlies ||
        isCONMEBOLCompetition ||
        TIER_2_INTERNATIONAL.some(region => countryName.includes(region.toLowerCase())) ||
        countryName.includes('world') ||
        countryName.includes('europe') ||
        countryName.includes('international');

      // Allow all international competitions through
      if (isInternationalCompetition) {

        return true;
      }

      // Check if it's a popular country with geographic preferences
      const matchingCountry = POPULAR_COUNTRIES.find(country => 
        countryName.includes(country.toLowerCase())
      );

      if (!matchingCountry) {

        return false;
      }

      // Enhanced filtering based on geographic tiers
      const countryKey = matchingCountry;

      // Tier 1 countries (England, Spain, Italy, Germany, France) - show all major leagues
      if (TIER_1_COUNTRIES.map(c => c.toLowerCase()).includes(countryKey.toLowerCase())) {
        const countryLeagues = POPULAR_LEAGUES_BY_COUNTRY[countryKey] || [];
        if (countryLeagues.length > 0 && !countryLeagues.includes(leagueId)) {

          return false;
        }
      }

      // Tier 3 countries (Brazil, Saudi Arabia, Egypt, USA, United Arab Emirates) - be more permissive for Brazil and Egypt
      else if (TIER_3_OTHER_POPULAR.map(c => c.toLowerCase()).includes(countryKey.toLowerCase())) {
        // For Brazil, allow Serie A, Serie B, Serie C, and Serie D
        if (countryKey.toLowerCase() === 'brazil') {
          const brazilLeagues = [71, 72, 73, 74]; // Serie A, Serie B, Serie C, Serie D
          if (!brazilLeagues.includes(leagueId)) {

            return false;
          }
        } 
        // For Egypt, allow all Premier League matches (ID: 233)
        else if (countryKey.toLowerCase() === 'egypt') {
          const egyptLeagues = [233]; // Egyptian Premier League
          if (!egyptLeagues.includes(leagueId)) {

            return false;
          }
        }
        // For United Arab Emirates, allow UAE Pro League (ID: 301)
        else if (countryKey.toLowerCase() === 'united arab emirates') {
          const uaeLeagues = [301]; // UAE Pro League
          if (!uaeLeagues.includes(leagueId)) {

            return false;
          }
        }
        else {
          // For other Tier 3 countries (Saudi Arabia), be very restrictive
          const countryLeagues = POPULAR_LEAGUES_BY_COUNTRY[countryKey] || [];
          if (!countryLeagues.includes(leagueId)) {

            return false;
          }
        }
      }

      return true;
    });


  // Group fixtures by country and league, with special handling for Friendlies
  const fixturesByCountry = allFixtures.reduce((acc: any, fixture: any) => {
    // Add comprehensive null checks
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      console.warn('Invalid fixture data:', fixture);
      return acc;
    }

    // Ensure league has required properties
    const league = fixture.league;
    if (!league.id || !league.name) {
      console.warn('Invalid league data:', league);
      return acc;
    }

    // Use centralized exclusion filter
    const leagueName = league.name || '';
    const homeTeamName = fixture.teams?.home?.name || '';
    const awayTeamName = fixture.teams?.away?.name || '';

    // Check if fixture should be excluded using centralized filter
    if (shouldExcludeFixture(leagueName, homeTeamName, awayTeamName)) {

      return acc;
    }

    const country = league.country;

    // Skip fixtures without a valid country, but keep World and Europe competitions
    if (!country || 
        country === null ||
        country === undefined ||
        typeof country !== 'string' || 
        country.trim() === '' || 
        country.toLowerCase() === 'unknown') {

      // Note: Friendlies are now filtered out above, so this section is no longer needed

      // Allow World competitions, CONMEBOL, and Friendlies to pass through
      if (league.name && (
          league.name.toLowerCase().includes('world') || 
          league.name.toLowerCase().includes('europe') ||
          league.name.toLowerCase().includes('uefa') ||
          league.name.toLowerCase().includes('fifa') ||
          league.name.toLowerCase().includes('fifa club world cup') ||
          league.name.toLowerCase().includes('champions') ||
          league.name.toLowerCase().includes('conference') ||
          league.name.toLowerCase().includes('friendlies') ||
          league.name.toLowerCase().includes('conmebol') ||
          league.name.toLowerCase().includes('copa america') ||
          league.name.toLowerCase().includes('copa libertadores') ||
          league.name.toLowerCase().includes('copa sudamericana'))) {

        // Determine the appropriate country key
        let countryKey = 'World';
        if (league.name.toLowerCase().includes('fifa club world cup') || 
            league.name.toLowerCase().includes('club world cup')) {
          countryKey = 'International';
        } else if (league.name.toLowerCase().includes('conmebol') ||
            league.name.toLowerCase().includes('copa america') ||
            league.name.toLowerCase().includes('copa libertadores') ||
            league.name.toLowerCase().includes('copa sudamericana')) {
          countryKey = 'South America';
        } else if (league.name.toLowerCase().includes('uefa') ||
                   league.name.toLowerCase().includes('europe') ||
                   league.name.toLowerCase().includes('champions') ||
                   league.name.toLowerCase().includes('conference')) {
          countryKey = 'Europe';
        }

        if (!acc[countryKey]) {
          acc[countryKey] = {
            country: countryKey,
            flag: getCountryFlagWithFallback(countryKey),
            leagues: {},
            hasPopularLeague: true
          };
        }
        const leagueId = league.id;

        if (!acc[countryKey].leagues[leagueId]) {
          acc[countryKey].leagues[leagueId] = {
            league: { ...league, country: countryKey },
            matches: [],
            isPopular: POPULAR_LEAGUES.includes(leagueId),
            isFriendlies: league.name.toLowerCase().includes('friendlies')
          };
        }
        acc[countryKey].leagues[leagueId].matches.push(fixture);
        return acc;
      }

      console.log(`Skipping fixture with invalid country: ${country}, league: ${league.name}`);
      return acc;
    }

    const validCountry = country.trim();

    // Only allow valid country names, World, and Europe
    if (validCountry !== 'World' && validCountry !== 'Europe' && validCountry.length === 0) {
      console.warn('Skipping fixture with empty country name:', country, fixture);
      return acc;
    }

    const leagueId = league.id;
    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlagWithFallback(country, league.flag),
        leagues: {},
        hasPopularLeague: false
      };
    }

    // Check if this is a popular league for this country
    const countryPopularLeagues = POPULAR_LEAGUES_BY_COUNTRY[country] || [];
    const isPopularForCountry = countryPopularLeagues.includes(leagueId);
    const isGloballyPopular = POPULAR_LEAGUES.includes(leagueId);

    if (isPopularForCountry || isGloballyPopular) {
      acc[country].hasPopularLeague = true;
    }

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: {
          ...league,
          logo: league.logo || 'https://media.api-sports.io/football/leagues/1.png'
        },
        matches: [],
        isPopular: isPopularForCountry || isGloballyPopular,
        isPopularForCountry: isPopularForCountry,
        isFriendlies: false
      };
    }

    // Validate team data before adding
    if (fixture.teams.home && fixture.teams.away && 
        fixture.teams.home.name && fixture.teams.away.name) {
      acc[country].leagues[leagueId].matches.push({
        ...fixture,
        teams: {
          home: {
            ...fixture.teams.home,
            logo: fixture.teams.home.logo || '/assets/fallback-logo.svg'
          },
          away: {
            ...fixture.teams.away,
            logo: fixture.teams.away.logo || '/assets/fallback-logo.svg'
          }
        }
      });
    }

    return acc;
  },```text
{}

  // Filter to show only popular countries with badge system
  const filteredCountries = Object.values(fixturesByCountry).filter((countryData: any) => {
    // Add comprehensive null checks
    if (!countryData || typeof countryData !== 'object') {
      return false;
    }

    // Add null check for country before string operations with safe handling
    const countryStr = safeSubstring(countryData.country, 0);
    if (!countryStr || countryStr.trim() === '') {
      return false;
    }

    const countryName = countryStr.trim().toLowerCase();

    // Exclude Argentina explicitly
    if (countryName === 'argentina') {
      return false;
    }

    // Always include countries with popular leagues that are in our popular countries list
    if (countryData.hasPopularLeague && POPULAR_COUNTRIES_ORDER.some(country => 
      safeSubstring(countryName, 0).toLowerCase() === safeSubstring(country, 0).toLowerCase()
    )) {
      return true;
    }

    // Include if it's one of the popular countries (exact match for better filtering)
    return POPULAR_COUNTRIES_ORDER.some(country => 
      safeSubstring(countryName, 0).toLowerCase() === safeSubstring(country, 0).toLowerCase()
    );
  });

  // Create a flat list of all leagues with their metadata for sorting
  const allLeaguesFlat = filteredCountries.flatMap((countryData: any) => 
    Object.values(countryData.leagues).map((leagueData: any) => ({
      ...leagueData,
      country: countryData.country,
      countryFlag: countryData.flag,
      hasPopularLeague: countryData.hasPopularLeague
    }))
  );

  // Sort leagues with priority: UEFA > FIFA > Popular Leagues > Friendlies > CONMEBOL > Regular League
  const sortedLeagues = allLeaguesFlat.sort((a: any, b: any) => {
    const aLeagueName = a.league?.name || '';
    const bLeagueName = b.league?.name || '';
    const aLeagueId = a.league?.id;
    const bLeagueId = b.league?.id;

    // Define priority categories: UEFA > FIFA > Popular Country Leagues > Friendlies > CONMEBOL > Regular League
    const getPriority = (leagueName: string, leagueId: number, country: string) => {
      const name = leagueName.toLowerCase();
      const countryLower = country.toLowerCase();

      // 1. UEFA competitions (highest priority)
      if (name.includes('uefa') || name.includes('champions league') || 
          name.includes('europa league') || name.includes('conference league') ||
          leagueId === 2 || leagueId === 3 || leagueId === 848) {
        return 1;
      }

      // 2. FIFA competitions
      if (name.includes('fifa') || name.includes('world cup') || 
          name.includes('club world cup') || leagueId === 1 || leagueId === 15) {
        return 2;
      }

      // 3. Popular Country Leagues (Top domestic leagues from major countries)
      const popularCountryLeagues = [
        // England Premier League
        { id: 39, country: 'england' },
        // Spain La Liga
        { id: 140, country: 'spain' },
        // Italy Serie A
        { id: 135, country: 'italy' },
        // Germany Bundesliga
        { id: 78, country: 'germany' },
        // France Ligue 1
        { id: 61, country: 'france' },
        // Brazil Serie A
        { id: 71, country: 'brazil' },
        // Saudi Pro League
        { id: 307, country: 'saudi arabia' },
        // Egypt Premier League
        { id: 233, country: 'egypt' },
        // Major League Soccer (USA)
        { id: 253, country: 'usa' },
        { id: 254, country: 'usa' }
      ];

      const isPopularCountryLeague = popularCountryLeagues.some(league => 
        league.id === leagueId || 
        (countryLower.includes(league.country) && (
          (league.country === 'england' && name.includes('premier league')) ||
          (league.country === 'spain' && name.includes('la liga')) ||
          (league.country === 'italy' && name.includes('serie a')) ||
          (league.country === 'germany' && name.includes('bundesliga')) ||
          (league.country === 'france' && name.includes('ligue 1')) ||
          (league.country === 'brazil' && name.includes('serie a')) ||
          (league.country === 'saudi arabia' && (name.includes('saudi pro league') || name.includes('saudi professional league'))) ||
          (league.country === 'egypt' && name.includes('premier league')) ||
          (league.country === 'usa' && (name.includes('major league soccer') || name.includes('mls')))
        ))
      );

      if (isPopularCountryLeague) {
        return 3;
      }

      // 4. Friendlies
      if (name.includes('friendlies') || name.includes('club friendly') || leagueId === 10) {
        return 4;
      }

      // 5. CONMEBOL competitions
      if (name.includes('conmebol') || name.includes('libertadores') || 
          name.includes('sudamericana') || name.includes('copa america') ||
          leagueId === 9 || leagueId === 11 || leagueId === 13 ||
          countryLower.includes('south america')) {
        return 5;
      }

      // 6. Regular leagues (everything else)
      return 6;
    };

    const aPriority = getPriority(aLeagueName, aLeagueId, a.country || '');
    const bPriority = getPriority(bLeagueName, bLeagueId, b.country || '');

    // Sort by priority first
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Within same priority, sort by specific order for UEFA competitions
    if (aPriority === 2 && bPriority === 2) {
      const uefaOrder = ['champions league', 'europa league', 'conference league'];
      const aUefaIndex = uefaOrder.findIndex(comp => aLeagueName.toLowerCase().includes(comp));
      const bUefaIndex = uefaOrder.findIndex(comp => bLeagueName.toLowerCase().includes(comp));

      if (aUefaIndex !== -1 && bUefaIndex !== -1) {
        return aUefaIndex - bUefaIndex;
      }
      if (aUefaIndex !== -1) return -1;
      if (bUefaIndex !== -1) return 1;
    }

    // Within same priority, sort alphabetically
    return aLeagueName.toLowerCase().localeCompare(bLeagueName.toLowerCase());
  });

  // Group sorted leagues back by country while maintaining league order
  const sortedCountries = [];
  const countriesMap: { [key: string]: any } = {};

  sortedLeagues.forEach((leagueData: any) => {
    const country = leagueData.country;

    if (!countriesMap[country]) {
      countriesMap[country] = {
        country: country,
        flag: leagueData.countryFlag,
        leagues: {},
        hasPopularLeague: leagueData.hasPopularLeague,
      };
      sortedCountries.push(countriesMap[country]);
    }

    countriesMap[country].leagues[leagueData.league.id] = leagueData;
  });

  // Now sortedCountries contains countries in the order of their most popular leagues
  // and each country contains leagues in the desired order.



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

  // Calculate date strings for comparison - use actual current date for reference
  const actualCurrentDate = new Date();
  const actualTodayString = format(actualCurrentDate, 'yyyy-MM-dd');
  const actualYesterdayString = format(subDays(actualCurrentDate, 1), 'yyyy-MM-dd');
  const actualTomorrowString = format(addDays(actualCurrentDate, 1), 'yyyy-MM-dd');

  // Get header title based on selected date with accurate date comparison
  const getHeaderTitle = () => {
    // Determine what type of matches to show based on selected date
    const isSelectedToday = selectedDate === actualTodayString;
    const isSelectedYesterday = selectedDate === actualYesterdayString;
    const isSelectedTomorrow = selectedDate === actualTomorrowString;

    let baseTitle = "";

    // Use exact string comparison for accurate date matching
    if (isSelectedToday) {
      baseTitle = "Today's Popular Football League - NEW VERSION";
    } else if (isSelectedYesterday) {
      baseTitle = "Yesterday's Popular Football League - NEW VERSION";
    } else if (isSelectedTomorrow) {
      baseTitle = "Tomorrow's Popular Football League - NEW VERSION";
    } else {
      const selectedDateObj = parseISO(selectedDate);
      baseTitle = `Popular Football League - NEW VERSION - ${format(selectedDateObj, 'MMM d, yyyy')}`;
    }

    return baseTitle;
  };

  // Get display title based on selected date
  const getDateDisplayTitle = () => {
    // Determine what type of matches to show based on selected date
    const isSelectedToday = selectedDate === actualTodayString;
    const isSelectedYesterday = selectedDate === actualYesterdayString;
    const isSelectedTomorrow = selectedDate === actualTomorrowString;

    if (isSelectedToday) return "Today's Matches";
    if (isSelectedYesterday) return "Yesterday's Matches";
    if (isSelectedTomorrow) return "Tomorrow's Matches";

    // For other dates, show formatted date
    try {
      const date = parseISO(selectedDate);
      return isValid(date)```text
 ? format(date, 'MMMM d, yyyy') + ' Matches' : selectedDate;
    } catch {
      return selectedDate;
    }
  };

  // Use cached data if available, even during loading
  const hasCachedFixtures = cachedFixtures && cachedFixtures.length > 0;
  const hasCachedPopular = cachedPopularFixtures && cachedPopularFixtures.length > 0;
  const combinedCachedData = [...(cachedFixtures || []), ...(cachedPopularFixtures || [])].filter((fixture, index, self) => 
    index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
  );

  // Show loading only if no cached data exists and we're actually loading
  if ((isLoading || isLoadingPopular) && combinedCachedData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
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

  // Format the time for display - using same format as TodaysMatchesByCountryNew
  const formatMatchTime = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== 'string') return '--:--';

    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
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
    <div>
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 mt-4">
        <h2 className="text-lg font-semibold text-gray-800">Popular Football Leagues</h2>
      </div>
      {sortedCountries.map((countryData: any) => (
        <div key={countryData.country} className="mb-4">

<div className="space-y-4">
            {Object.values(countryData.leagues).map((leagueData: any, leagueIndex: number) => (
                <Card key={leagueData.league.id} className={`overflow-hidden shadow-md ${leagueIndex === 0 ? '-mt-4' : ''}`}>
                  <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <img
                        src={leagueData.league.logo}
                        alt={leagueData.league.name}
                        className="w-5 h-5 rounded object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/fallback-logo.svg') {target.src = '/assets/fallback-logo.svg';
                          }
                        }}
                      />
                      <div className="flex flex-col">
                        <h3 className="text-sm font-medium text-gray-700">{leagueData.league.name}</h3>
                        <span className="text-xs text-gray-500">{leagueData.league.country}</span>
                      </div>
                    </div>

                  <CardContent className="p-0">
                    <div className="space-y-0">
                    {leagueData.matches.map((match: any) => (
                      <div
                        key={match.fixture.id}
                        className="bg-white hover:bg-stone-100 transition-all duration-200 cursor-pointer border-b border-gray-300 last:border-b-0 group relative"
                      >
                        <div className="flex items-center px-3 py-2">
                          {/* Star icon with hover slide effect */}
                          <div className="absolute left-0 top-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-6 group-hover:translate-x-0 z-10">
                            <button 
                              className="h-full px-1 hover:bg-blue-50 transition-colors duration-200 bg-white shadow-sm flex items-center justify-center"
                              onMouseEnter={(e) => e.currentTarget.closest('.group').classList.add('button-hovered')}
                              onMouseLeave={(e) => e.currentTarget.closest('.group').classList.remove('button-hovered')}
                            >
                              <svg 
                                className="w-4 h-4 text-blue-500 stroke-current fill-none hover:text-blue-600" 
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                        </button>
                          </div>
                          {/* Home Team */}
                          <div className="text-right text-sm text-gray-900 min-w-0 flex-1 pr-2 pl-3 truncate">
                            <div>{match.teams.home.name}</div>
                            {['NS', 'TBD'].includes(match.fixture.status.short) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {match.fixture.status.short === 'TBD' ? 'TBD' : format(parseISO(match.fixture.date), 'HH:mm')}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 mx-1">
                            <img
                              src={match.teams.home.logo || '/assets/fallback-logo.svg'}
                              alt={match.teams.home.name}
                              className="w-12 h-12 object-contain"
                                  onError={createFallbackHandler({
                                    teamId: match.teams.home.id,
                                    teamName: match.teams.home.name,
                                    originalUrl: match.teams.home.logo,
                                    size: 'medium'
                                  })}
                            />
                          </div>

                          {/* Score/Time Center */}
                          <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                            {(() => {
                              const status = match.fixture.status.short;
                              const fixtureDate = parseISO(match.fixture.date);

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
                              }

                              // All finished match statuses
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
                                                   status === 'AET' ? 'AET - No Score' :
                                                   status === 'PEN' ? 'PEN - No Score' :
                                                   status === 'AWD' ? 'Awarded' :
                                                   status === 'WO' ? 'Walkover' :
                                                   status === 'ABD' ? 'Abandoned' :
                                                   status === 'CANC' ? 'Cancelled' :
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

                              // Upcoming matches (NS = Not Started, TBD = To Be Determined)
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
                              src={match.teams.away.logo || '/assets/fallback-logo.svg'}
                              alt={match.teams.away.name}
                              className="w-12 h-12 object-contain"
                              onError={createFallbackHandler({
                                teamId: match.teams.away.id,
                                teamName: match.teams.away.name,
                                originalUrl: match.teams.away.logo,
                                size: 'medium'
                              })}
                            />
                          </div>

                          {/* League Info */}
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          </div>

                          {/* Away Team */}
                          <div className="text-left text-sm text-gray-900 min-w-0 flex-1 pl-2 truncate">
                            <div>{match.teams.away.name}</div>
                            {['NS', 'TBD'].includes(match.fixture.status.short) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {match.fixture.status.short === 'TBD' ? 'TBD' : format(parseISO(match.fixture.date), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      ))}
    </div>
);
};

export default TodayPopularFootballLeaguesNew;