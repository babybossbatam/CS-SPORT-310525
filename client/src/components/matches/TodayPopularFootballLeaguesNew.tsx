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

  const cachedFixtures = CacheManager.getCachedData(fixturesQueryKey, 30 * 60 * 1000); // 30 minutes

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

  // Use only main fixtures query - no separate popular fixtures query needed



  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;



  // Use only main fixtures and filter client-side for popular leagues
  const allFixtures = fixtures
    .filter((fixture, index, self) => {
      // Ensure unique fixtures
      const isUnique = index === self.findIndex(f => f.fixture.id === fixture.fixture.id);
      if (!isUnique) return false;

      // Only keep fixtures that match the exact selected date
      if (fixture?.fixture?.date) {
        try {
          const fixtureDate = parseISO(fixture.fixture.date);
          if (isValid(fixtureDate)) {
            const fixtureDateString = format(fixtureDate, 'yyyy-MM-dd');
            const matchesSelectedDate = fixtureDateString === selectedDate;

            if (!matchesSelectedDate) {
              return false;
            }

            // Client-side filtering for popular leagues and countries
            const leagueId = fixture.league?.id;
            const country = fixture.league?.country?.toLowerCase() || '';

            // Check if it's a popular league
            const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

            // Check if it's from a popular country
            const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(popularCountry => 
              country.includes(popularCountry.toLowerCase())
            );

            // Check if it's an international competition
            const leagueName = fixture.league?.name?.toLowerCase() || '';
            const isInternationalCompetition = 
              leagueName.includes('champions league') ||
              leagueName.includes('europa league') ||
              leagueName.includes('conference league') ||
              leagueName.includes('world cup') ||
              leagueName.includes('fifa') ||
              leagueName.includes('uefa') ||
              leagueName.includes('conmebol') ||
              leagueName.includes('libertadores') ||
              leagueName.includes('sudamericana') ||
              leagueName.includes('friendlies') ||
              country.includes('world') ||
              country.includes('europe') ||
              country.includes('international');

            return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
          }
        } catch (error) {
          console.error('Error parsing fixture date:', error);
          return false;
        }
      }

      return false;
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
  const fixturesByCountry = filteredFixtures.reduce((acc: any, fixture: any) => {
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
  }, {});

  // Filter to show only popular countries with badge system
  const filteredCountries = Object.values(fixturesByCountry).filter((countryData: any) => {