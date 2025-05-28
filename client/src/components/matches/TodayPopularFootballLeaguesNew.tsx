import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours, isToday, isYesterday, isTomorrow, subDays, addDays } from 'date-fns';
import { safeSubstring } from '@/lib/dateUtilsUpdated';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { QUERY_CONFIGS, CACHE_FRESHNESS } from '@/lib/cacheConfig';
import { useCachedQuery, CacheManager } from '@/lib/cachingHelper';
import { getCurrentUTCDateString } from '@/lib/dateUtilsTodayMatch';

interface TodayPopularFootballLeaguesNewProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop20?: boolean;
}

const TodayPopularFootballLeaguesNew: React.FC<TodayPopularFootballLeaguesNewProps> = ({ 
  selectedDate, 
  timeFilterActive = false, 
  showTop20 = false 
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [enableFetching, setEnableFetching] = useState(true);

  // Geographic/Regional preferences with priority tiers
  const TIER_1_COUNTRIES = ['England', 'Spain', 'Italy', 'Germany', 'France']; // Top priority European countries
  const TIER_2_INTERNATIONAL = ['World', 'Europe']; // International competitions
  const TIER_3_OTHER_POPULAR = ['Brazil', 'Saudi Arabia', 'Egypt', 'USA']; // Other popular countries

  const POPULAR_COUNTRIES_ORDER = [
    'World', // Men's international friendlies and other World competitions first
    'Europe', // UEFA Europa Conference League and other European competitions
    'Egypt', // Egypt Premier League
    'USA', // USA MLS league
    ...TIER_1_COUNTRIES.filter(c => c !== 'England' && c !== 'Spain' && c !== 'Italy' && c !== 'Germany' && c !== 'France'), // Remove duplicates if any
    'England', 'Spain', 'Italy', 'Germany', 'France', // Other European countries
    ...TIER_3_OTHER_POPULAR.filter(c => c !== 'Egypt'), // Other popular countries except Egypt (already listed)
    'CONMEBOL'
  ];

  // Enhanced leagues by country with tier-based filtering
  const POPULAR_LEAGUES_BY_COUNTRY = {
    'England': [39, 45, 48], // Premier League, FA Cup, EFL Cup
    'Spain': [140, 143], // La Liga, Copa del Rey
    'Italy': [135, 137], // Serie A, Coppa Italia
    'Germany': [78, 81], // Bundesliga, DFB Pokal
    'France': [61, 66], // Ligue 1, Coupe de France
    'Brazil': [71, 72], // Serie A Brazil, Serie B Brazil
    'Saudi Arabia': [307], // Saudi Pro League (only major league)
    'Egypt': [233], // Egyptian Premier League (only major league)
    'USA': [253, 254], // Only Major League Soccer (MLS) and MLS Next Pro
    'Europe': [2, 3, 848], // Champions League, Europa League, Conference League
    'World': [1, 10, 9, 11, 13], // World Cup, Friendlies, Copa America, Copa Libertadores, Copa Sudamericana
    'CONMEBOL': [9, 11, 13], // Copa America, Copa Libertadores, Copa Sudamericana
  };

  // Flatten popular leagues for backward compatibility
  const POPULAR_LEAGUES = Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat();

  // Popular teams for match prioritization
  const POPULAR_TEAMS = [
    // Premier League
    33, 40, 42, 50, 47, 49, // Manchester United, Liverpool, Arsenal, Manchester City, Tottenham, Chelsea
    // La Liga
    529, 541, 530, 548, 727, // Barcelona, Real Madrid, Atletico Madrid, Real Sociedad, Athletic Bilbao
    // Serie A
    489, 492, 496, 500, 502, 505, // AC Milan, Napoli, Juventus, Inter, Fiorentina, Lazio
    // Bundesliga
    157, 165, 168, 173, 192, // Bayern Munich, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Eintracht Frankfurt
    // Champions League popular teams
    85, 81, 212, 548, // Paris Saint Germain, AS Monaco, Real Sociedad, Real Sociedad
  ];

  // Check if we have fresh cached data
  const fixturesQueryKey = ['all-fixtures-by-date', selectedDate];
  const popularQueryKey = ['popular-fixtures', selectedDate];

  const cachedFixtures = CacheManager.getCachedData(fixturesQueryKey, 30 * 60 * 1000); // 30 minutes
  const cachedPopularFixtures = CacheManager.getCachedData(popularQueryKey, 30 * 60 * 1000);

  // Fetch all fixtures for the selected date with smart caching
  const { data: fixtures = [], isLoading, isFetching } = useCachedQuery(
    fixturesQueryKey,
    async () => {
      console.log(`TodayPopularFootballLeaguesNew - Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`TodayPopularFootballLeaguesNew - Received ${data.length} fixtures for ${selectedDate}`);

      // Debug: Check first few fixtures' dates
      if (data.length > 0) {
        data.slice(0, 3).forEach((fixture, index) => {
          if (fixture?.fixture?.date) {
            const fixtureDate = parseISO(fixture.fixture.date);
            const fixtureDateString = format(fixtureDate, 'yyyy-MM-dd');
            console.log(`Fixture ${index + 1} date: ${fixtureDateString} (expected: ${selectedDate})`);
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
      console.log(`Fetching popular league fixtures for ${selectedDate}`);

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

                if (isMatch) {
                  console.log(`Match found for ${selectedDate}: ${match.teams?.home?.name || 'Unknown'} vs ${match.teams?.away?.name || 'Unknown'} on ${fixtureUTCDateString}`);
                }

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

      console.log(`Fetched ${allData.length} popular league fixtures for date ${selectedDate}`);
      return allData;
    },
    {
      enabled: POPULAR_LEAGUES.length > 0 && !!selectedDate && enableFetching,
      maxAge: 45 * 60 * 1000, // Increased cache time to 45 minutes
      backgroundRefresh: true,
      staleTime: 30 * 60 * 1000, // Don't refetch for 30 minutes unless explicitly requested
    }
  );

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());
  }, [selectedDate]);

  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

  // Enhanced country flag mapping with SportsRadar fallback
  const getCountryFlag = (country: string | null | undefined, leagueFlag?: string | null) => {
    // Use league flag if available and valid
    if (leagueFlag && typeof leagueFlag === 'string' && leagueFlag.trim() !== '') {
      return leagueFlag;
    }

    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== 'string' || country.trim() === '') {
      return '/assets/fallback-logo.svg'; // Default football logo
    }

    const cleanCountry = country.trim();

    // Special handling for Unknown country only
    if (cleanCountry === 'Unknown') {
      return '/assets/fallback-logo.svg'; // Default football logo
    }

    // Special cases for international competitions
    if (cleanCountry === 'World') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
    }

    if (cleanCountry === 'Europe') {
      return 'https://flagsapi.com/EU/flat/24.png';
    }

    if (cleanCountry === 'CONMEBOL') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzAwN2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjZmZmZmZmIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMwMDdmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMwMDdmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
    }

    if (cleanCountry === 'USA') {
      return 'https://flagsapi.com/US/flat/24.png';
    }

    // Comprehensive country code mapping
    const countryCodeMap: { [key: string]: string } = {
      // Major football countries
      'England': 'GB-ENG',
      'Scotland': 'GB-SCT',
      'Wales': 'GB-WLS',
      'Northern Ireland': 'GB-NIR',
      'United States': 'US',
      'South Korea': 'KR',
      'Czech Republic': 'CZ',
      'United Arab Emirates': 'AE',
      'Bosnia & Herzegovina': 'BA',
      'North Macedonia': 'MK',
      'Trinidad & Tobago': 'TT',
      'Ivory Coast': 'CI',
      'Cape Verde': 'CV',
      'Democratic Republic of Congo': 'CD',
      'Curacao': 'CW',
      'Faroe Islands': 'FO',
      'Saudi Arabia': 'SA',
      'South Africa': 'ZA',
      'Costa Rica': 'CR',
      'El Salvador': 'SV',
      'Puerto Rico': 'PR',
      'New Zealand': 'NZ',
      'Dominican Republic': 'DO',
      'Sierra Leone': 'SL',
      'Burkina Faso': 'BF',
      'Guinea-Bissau': 'GW',
      'Equatorial Guinea': 'GQ',
      'Central African Republic': 'CF',
      'Papua New Guinea': 'PG',
      'Solomon Islands': 'SB',
      'Marshall Islands': 'MH',
      'Cook Islands': 'CK',
      'American Samoa': 'AS',
      'British Virgin Islands': 'VG',
      'Cayman Islands': 'KY',
      'Turks and Caicos Islands': 'TC',
      'Saint Kitts and Nevis': 'KN',
      'Saint Vincent and the Grenadines': 'VC',
      'Antigua and Barbuda': 'AG',
      'São Tomé and Príncipe': 'ST',
      'North Korea': 'KP',
      'East Timor': 'TL',
      'Vatican City': 'VA',
      // Common countries that might appear
      'Brazil': 'BR',
      'Argentina': 'AR',
      'Germany': 'DE',
      'France': 'FR',
      'Italy': 'IT',
      'Spain': 'ES',
      'Portugal': 'PT',
      'Netherlands': 'NL',
      'Belgium': 'BE',
      'Switzerland': 'CH',
      'Austria': 'AT',
      'Poland': 'PL',
      'Turkey': 'TR',
      'Russia': 'RU',
      'Ukraine': 'UA',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Greece': 'GR',
      'Croatia': 'HR',
      'Serbia': 'RS',
      'Romania': 'RO',
      'Bulgaria': 'BG',
      'Hungary': 'HU',
      'Slovenia': 'SI',
      'Slovakia': 'SK',
      'Lithuania': 'LT',
      'Latvia': 'LV',
      'Estonia': 'EE',
      'Ireland': 'IE',
      'Iceland': 'IS',
      'Luxembourg': 'LU',
      'Malta': 'MT',
      'Cyprus': 'CY',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Australia': 'AU',
      'Canada': 'CA',
      'Mexico': 'MX',
      'Colombia': 'CO',
      'Peru': 'PE',
      'Chile': 'CL',
      'Uruguay': 'UY',
      'Paraguay': 'PY',
      'Bolivia': 'BO',
      'Venezuela': 'VE',
      'Ecuador': 'EC',
      'Nigeria': 'NG',
      'Ghana': 'GH',
      'Senegal': 'SN',
      'Morocco': 'MA',
      'Tunisia': 'TN',
      'Algeria': 'DZ',
      'Egypt': 'EG',
      'Cameroon': 'CM',
      'Kenya': 'KE',
      'Ethiopia': 'ET',
      'South Sudan': 'SS',
      'Mali': 'ML',
      'Niger': 'NE',
      'Chad': 'TD',
      'Libya': 'LY',
      'Sudan': 'SD',
      'Israel': 'IL',
      'Jordan': 'JO',
      'Lebanon': 'LB',
      'Syria': 'SY',
      'Iraq': 'IQ',
      'Iran': 'IR',
      'Afghanistan': 'AF',
      'Pakistan': 'PK',
      'Bangladesh': 'BD',
      'Sri Lanka': 'LK',
      'Myanmar': 'MM',
      'Thailand': 'TH',
      'Vietnam': 'VN',
      'Cambodia': 'KH',
      'Laos': 'LA',
      'Malaysia': 'MY',
      'Singapore': 'SG',
      'Indonesia': 'ID',
      'Philippines': 'PH',
      'Brunei': 'BN',
      'Mongolia': 'MN',
      'Kazakhstan': 'KZ',
      'Uzbekistan': 'UZ',
      'Turkmenistan': 'TM',
      'Kyrgyzstan': 'KG',
      'Tajikistan': 'TJ'
    };

    // Use country mapping, fallback to SportsRadar for unknown countries
    let countryCode = 'XX';
    if (countryCodeMap[cleanCountry]) {
      countryCode = countryCodeMap[cleanCountry];
      return `https://flagsapi.com/${countryCode}/flat/24.png`;
    } else {
      console.warn('Unknown country for flag mapping, trying SportsRadar fallback:', cleanCountry);
      // Try SportsRadar flags API as fallback
      return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, '_')}/flag_24x24.png`;
    }
  };

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
              console.log(`Filtering out fixture from wrong date: ${fixtureDateString} (expected: ${selectedDate})`);
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
        console.log(`Filtering out fixture from wrong date: ${fixtureDateStr} (expected: ${expectedDateStr})`);
        return false;
      }

      // Apply exclusion filters
      if (shouldExcludeFixture(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name
      )) {
        console.log(`Filtering out excluded fixture: ${fixture.league.name} - ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
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
        console.log(`Filtering out excluded league: ${fixture.league.name}`);
        return false;
      }

      // Extra USA filtering - if it's from USA and not MLS (253) or MLS Next Pro (254), exclude it
      if (fixture.league.country?.toLowerCase() === 'usa' || 
          fixture.league.country?.toLowerCase() === 'united states') {
        const allowedUSALeagues = [253, 254];
        if (!allowedUSALeagues.includes(fixture.league.id)) {
          console.log(`Filtering out non-MLS USA league: ${fixture.league.name} (ID: ${fixture.league.id})`);
          return false;
        }
      }

      // Skip fixtures with null or undefined country
      if (!fixture.league.country) {
        console.log(`Filtering out fixture with null/undefined country: league: ${fixture.league.name}`);
        return false;
      }

      // Enhanced geographic/regional filtering logic
      console.log(`Processing match: ${fixture.league.name} (${fixture.league.country}) - ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);

      const countryName = fixture.league.country?.toLowerCase() || '';
      const leagueId = fixture.league.id;
      const leagueNameLower = fixture.league.name?.toLowerCase() || '';

      // Check for international competitions first (more permissive)
      // Prioritize men's international friendlies (exclude women's friendlies)
      const isWorldFriendlies = leagueNameLower.includes('friendlies') && 
                               countryName.includes('world') && 
                               !leagueNameLower.includes('women');
      const isCONMEBOLCompetition = 
        leagueNameLower.includes('copa america') ||
        leagueNameLower.includes('copa libertadores') ||
        leagueNameLower.includes('copa sudamericana') ||
        leagueNameLower.includes('conmebol') ||
        countryName.includes('conmebol');

      const isInternationalCompetition = 
        leagueNameLower.includes('champions league') ||
        leagueNameLower.includes('europa league') ||
        leagueNameLower.includes('conference league') ||
        leagueNameLower.includes('world cup') ||
        leagueNameLower.includes('euro') ||
        isWorldFriendlies ||
        isCONMEBOLCompetition ||
        TIER_2_INTERNATIONAL.some(region => countryName.includes(region.toLowerCase()));

      // Allow all international competitions through
      if (isInternationalCompetition) {
        console.log(`Allowing international competition: ${fixture.league.name} (ID: ${leagueId})`);
        return true;
      }

      // Check if it's a popular country with geographic preferences
      const matchingCountry = POPULAR_COUNTRIES.find(country => 
        countryName.includes(country.toLowerCase())
      );

      if (!matchingCountry) {
        console.log(`Filtering out fixture from non-popular country: ${fixture.league.country}, league: ${fixture.league.name}`);
        return false;
      }

      // Enhanced filtering based on geographic tiers
      const countryKey = matchingCountry;

      // Tier 1 countries (England, Spain, Italy, Germany, France) - show all major leagues
      if (TIER_1_COUNTRIES.map(c => c.toLowerCase()).includes(countryKey.toLowerCase())) {
        const countryLeagues = POPULAR_LEAGUES_BY_COUNTRY[countryKey] || [];
        if (countryLeagues.length > 0 && !countryLeagues.includes(leagueId)) {
          console.log(`Filtering out non-major league from Tier 1 country ${countryKey}: ${fixture.league.name} (ID: ${leagueId})`);
          return false;
        }
      }

      // Tier 3 countries (Brazil, Saudi Arabia, Egypt, USA) - be more permissive for Brazil
      else if (TIER_3_OTHER_POPULAR.map(c => c.toLowerCase()).includes(countryKey.toLowerCase())) {
        // For Brazil, allow both Serie A and Serie B
        if (countryKey.toLowerCase() === 'brazil') {
          const brazilLeagues = [71, 72]; // Serie A and Serie B
          if (!brazilLeagues.includes(leagueId)) {
            console.log(`Filtering out non-major league from Brazil: ${fixture.league.name} (ID: ${leagueId})`);
            return false;
          }
        } else {
          // For other Tier 3 countries (Saudi Arabia, Egypt), be very restrictive
          const countryLeagues = POPULAR_LEAGUES_BY_COUNTRY[countryKey] || [];
          if (!countryLeagues.includes(leagueId)) {
            console.log(`Filtering out non-major league from Tier 3 country ${countryKey}: ${fixture.league.name} (ID: ${leagueId})`);
            return false;
          }
        }
      }

      return true;
    });

    console.log(`Filtered to ${filtered.length} matches from popular leagues`);
    return filtered;
  }, [allFixtures, selectedDate]);

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
      console.log(`Filtering out excluded fixture: ${league.name} - ${homeTeamName} vs ${awayTeamName}`);
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
          league.name.toLowerCase().includes('champions') ||
          league.name.toLowerCase().includes('conference') ||
          league.name.toLowerCase().includes('friendlies') ||
          league.name.toLowerCase().includes('conmebol') ||
          league.name.toLowerCase().includes('copa america') ||
          league.name.toLowerCase().includes('copa libertadores') ||
          league.name.toLowerCase().includes('copa sudamericana'))) {

        // Determine the appropriate country key
        let countryKey = 'World';
        if (league.name.toLowerCase().includes('conmebol') ||
            league.name.toLowerCase().includes('copa america') ||
            league.name.toLowerCase().includes('copa libertadores') ||
            league.name.toLowerCase().includes('copa sudamericana')) {
          countryKey = 'CONMEBOL';
        } else if (league.name.toLowerCase().includes('uefa') ||
                   league.name.toLowerCase().includes('europe') ||
                   league.name.toLowerCase().includes('champions') ||
                   league.name.toLowerCase().includes('conference')) {
          countryKey = 'Europe';
        }

        if (!acc[countryKey]) {
          acc[countryKey] = {
            country: countryKey,
            flag: getCountryFlag(countryKey),
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
        flag: getCountryFlag(country, league.flag),
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
    // Add comprehensive null checks
    if (!countryData|| typeof countryData !== 'object') {
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

  // Enhanced sorting with domestic leagues prioritized over international competitions
  const sortedCountries = filteredCountries.sort((a: any, b: any) => {
    const aCountry = a.country || '';
    const bCountry = b.country || '';

    // Determine priority tier for each country (lower number = higher priority)
    const getTier = (country: string) => {
      // Tier 1: Major domestic leagues (highest priority)
      if (TIER_1_COUNTRIES.includes(country)) return 1;

      // Tier 2: Other popular domestic leagues
      if (TIER_3_OTHER_POPULAR.includes(country)) return 2;

      // Tier 3: International competitions (lower priority than domestic)
      if (TIER_2_INTERNATIONAL.includes(country)) return 3;

      // Tier 4: CONMEBOL
      if (country === 'CONMEBOL') return 4;

      return 999;
    };

    const aTier = getTier(aCountry);
    const bTier = getTier(bCountry);

    // Sort by tier first (domestic leagues before international)
    if (aTier !== bTier) {
      return aTier - bTier;
    }

    // Within same tier, prioritize countries with popular leagues
    if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
    if (!a.hasPopularLeague && b.hasPopularLeague) return 1;

    // Within same tier and popular league status, sort by order in POPULAR_COUNTRIES_ORDER
    const getOrderIndex = (country: string) => {
      const index = POPULAR_COUNTRIES_ORDER.findIndex(pc => 
        pc.toLowerCase() === country.toLowerCase()
      );
      return index === -1 ? 999 : index;
    };

    const aOrderIndex = getOrderIndex(aCountry);
    const bOrderIndex = getOrderIndex(bCountry);

    if (aOrderIndex !== bOrderIndex) {
      return aOrderIndex - bOrderIndex;
    }

    // Default to alphabetical sorting
    return aCountry.localeCompare(bCountry);
  });

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

    // Add time filter indicator
    if (timeFilterActive && showTop20) {
      baseTitle += " (Top 20 by Time)";
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
      return isValid(date) ? format(date, 'MMMM d, yyyy') + ' Matches' : selectedDate;
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

  // Format the time for display
  const formatMatchTime = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return '--:--';
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
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>
          <h2 className="text-xl font-bold text-gray-800">Popular Football Leagues</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4 p-4">
          <div className="bg-gray-50 p-3 rounded-md border">
            {/* Additional content div inside the main card */}
          </div>
          <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
            {/* New div inside main content area */}
          </div>
          {/* Create individual league cards from all countries */}
      {sortedCountries.flatMap((countryData: any) =>
        Object.values(countryData.leagues)
          .sort((a: any, b: any) => {
            // Special handling for World country - deprioritize Friendlies
            if (countryData.country === 'World') {
              const aIsFriendlies = a.league.name.toLowerCase().includes('friendlies');
              const bIsFriendlies = b.league.name.toLowerCase().includes('friendlies');

              // Put Friendlies at the end of World competitions
              if (aIsFriendlies && !bIsFriendlies) return 1;
              if (!aIsFriendlies && bIsFriendlies) return -1;

              return a.league.name.localeCompare(b.league.name);
            }

            // Prioritize leagues that are popular for this specific country
            if (a.isPopularForCountry && !b.isPopularForCountry) return -1;
            if (!a.isPopularForCountry && b.isPopularForCountry) return 1;

            // Then globally popular leagues
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;

            // Finally alphabetical
            return a.league.name.localeCompare(b.league.name);
          })
          .map((leagueData: any) => (
            <Card key={`${countryData.country}-${leagueData.league.id}`} className="overflow-hidden">
              {/* League Header - Always show unless time filter is active */}
              {!timeFilterActive && (
                <>
                  {leagueData.isFriendlies ? (
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                      <img
                        src={leagueData.league.logo || '/assets/fallback-logo.svg'}
                        alt={leagueData.league.name || 'Unknown League'}
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                        }}
                      />
                      <span className="font-medium text-sm text-blue-800">
                        {leagueData.league.name || 'Unknown League'}
                      </span>
                      <span className="text-xs text-blue-600">
                        {leagueData.matches.length} {leagueData.matches.length === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <img
                        src={leagueData.league.logo || '/assets/fallback-logo.svg'}
                        alt={leagueData.league.name || 'Unknown League'}
                        className="w-6 h-6 object-contain mt-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-base text-gray-800">
                          {safeSubstring(leagueData.league.name, 0) === 'CONMEBOL Libertadores' ? 'Libertadores' : 
                           safeSubstring(leagueData.league.name, 0) === 'CONMEBOL Sudamericana' ? 'Sudamericana' : 
                           safeSubstring(leagueData.league.name, 0) || 'Unknown League'}
                        </span>
                        <span className="text-xs text-gray-600">
                          {leagueData.league.country || 'Unknown Country'}
                        </span>
                      </div>
                      <div className="flex gap-1 ml-auto">
                        {leagueData.isPopularForCountry && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Popular Country
                          </span>
                        )}
                        {leagueData.isPopular && !leagueData.isPopularForCountry && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Matches - Show for all leagues */}
              <CardContent className="p-0">
                <div className="space-y-0">
                  {leagueData.matches
                    .slice(0, timeFilterActive && showTop20 ? 20 : undefined)
                    .sort((a: any, b: any) => {
                      // When time filter is active, prioritize by time more strictly
                      if (timeFilterActive) {
                        const aDate = parseISO(a.fixture.date);
                        const bDate = parseISO(b.fixture.date);
                        const now = new Date();

                        // Ensure valid dates
                        if (!isValid(aDate) || !isValid(bDate)) {
                          return 0;
                        }

                        const aTime = aDate.getTime();
                        const bTime = bDate.getTime();
                        const nowTime = now.getTime();

                        // Calculate time distance from now
                        const aDistance = Math.abs(aTime - nowTime);
                        const bDistance = Math.abs(bTime - nowTime);

                        // Prioritize matches closest to current time
                        return aDistance - bDistance;
                      }

                      // Original sorting logic when time filter is not active
                      const aStatus = a.fixture.status.short;
                      const bStatus = b.fixture.status.short;
                      const aDate = parseISO(a.fixture.date);
                      const bDate = parseISO(b.fixture.date);

                      // Ensure valid dates
                      if (!isValid(aDate) || !isValid(bDate)) {
                        return 0;
                      }

                      const now = new Date();
                      const aTime = aDate.getTime();
                      const bTime = bDate.getTime();

                      // Check if matches involve popular teams (with null safety)
                      const aHasPopularTeam = (a.teams?.home?.id && POPULAR_TEAMS.includes(a.teams.home.id)) || 
                                             (a.teams?.away?.id && POPULAR_TEAMS.includes(a.teams.away.id));
                      const bHasPopularTeam = (b.teams?.home?.id && POPULAR_TEAMS.includes(b.teams.home.id)) || 
                                             (b.teams?.away?.id && POPULAR_TEAMS.includes(b.teams.away.id));

                      // Prioritize popular team matches first
                      if (aHasPopularTeam && !bHasPopularTeam) return -1;
                      if (!aHasPopularTeam && bHasPopularTeam) return 1;

                      // Define status categories
                      const aLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
                      const bLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);

                      const aFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(aStatus);
                      const bFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(bStatus);

                      const aUpcoming = aStatus === 'NS' && !aLive && !aFinished;
                      const bUpcoming = bStatus === 'NS' && !bLive && !bFinished;

                      // Assign priority scores (lower = higher priority)
                      let aPriority = 0;
                      let bPriority = 0;

                      if (aLive) aPriority = 1;
                      else if (aUpcoming) aPriority = 2;
                      else if (aFinished) aPriority = 3;
                      else aPriority = 4;

                      if (bLive) bPriority = 1;
                      else if (bUpcoming) bPriority = 2;
                      else if (bFinished) bPriority = 3;
                      else bPriority = 4;

                      // Second sort by match status priority
                      if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                      }

                      // If same priority, sort by time within category
                      if (aLive && bLive) {
                        // For live matches, show earliest start time first
                        return aTime - bTime;
                      }

                      if (aUpcoming && bUpcoming) {
                        // For upcoming matches, show earliest start time first
                        return aTime - bTime;
                      }

                      if (aFinished && bFinished) {
                        // For finished matches, show most recent first
                        return bTime - aTime;
                      }

                      // Default time-based sorting
                      return aTime - bTime;
                    })
                    .map((match: any) => (
                    <div 
                      key={match.fixture.id} 
                      className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center px-3 py-2">
                        {/* Home Team */}
                        <div className="text-right text-sm text-gray-900 min-w-0 flex-1 pr-2 truncate">
                          {match.teams.home.name}
                        </div>

                        <div className="flex-shrink-0 mx-1">
                          <img
                            src={match.teams.home.logo || '/assets/fallback-logo.svg'}
                            alt={match.teams.home.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.log(`Failed to load home team logo: ${target.src} for ${match.teams.home.name}`);
                              if (target.src !== '/assets/fallback-logo.svg') {
                                target.src = '/assets/fallback-logo.svg';
                              }
                            }}
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
                                    <div className="text-xs text-gray-500 mb-1">
                                      {status === 'FT' ? 'Ended' : 
                                       status === 'AET' ? 'AET' :
                                       status === 'PEN' ? 'PEN' :
                                       status === 'AWD' ? 'Awarded' :
                                       status === 'WO' ? 'Walkover' :
                                       status === 'ABD' ? 'Abandoned' :
                                       status === 'CANC' ? 'Cancelled' :
                                       status === 'SUSP' ? 'Suspended' : status}
                                    </div>
                                    <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                      <span>{homeScore}</span>
                                      <span className="text-gray-400">-</span>
                                      <span>{awayScore}</span>
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.log(`Failed to load away team logo: ${target.src} for ${match.teams.away.name}`);
                              if (target.src !== '/assets/fallback-logo.svg') {
                                target.src = '/assets/fallback-logo.svg';
                              }
                            }}
                          />
                        </div>

                        {/* Away Team */}
                        <div className="text-left text-sm text-gray-900 min-w-0 flex-1 pl-2 truncate">
                          {match.teams.away.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayPopularFootballLeaguesNew;