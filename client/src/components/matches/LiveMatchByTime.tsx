
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours } from 'date-fns';

interface LiveMatchByTimeProps {
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const LiveMatchByTime: React.FC<LiveMatchByTimeProps> = ({ 
  refreshInterval = 30000, 
  isTimeFilterActive = false, 
  liveFilterActive = false, 
  timeFilterActive = false 
}) => {
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Fetch all live fixtures with automatic refresh
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['live-fixtures-all-countries'],
    queryFn: async () => {
      console.log('Fetching live fixtures for all countries');
      const response = await apiRequest('GET', '/api/fixtures/live');
      const data = await response.json();

      console.log(`Received ${data.length} live fixtures`);
      return data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection time
    enabled: enableFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: refreshInterval, // Auto-refresh every 30 seconds
  });

  // Enhanced country flag mapping with better null safety
  const getCountryFlag = (country: string | null | undefined, leagueFlag?: string | null) => {
    // Use league flag if available and valid
    if (leagueFlag && typeof leagueFlag === 'string' && leagueFlag.trim() !== '') {
      return leagueFlag;
    }

    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== 'string' || country.trim() === '') {
      return '/assets/fallback-logo.png'; // Default football logo
    }

    const cleanCountry = country.trim();

    // Special handling for Unknown country only
    if (cleanCountry === 'Unknown') {
      return '/assets/fallback-logo.png'; // Default football logo
    }

    // Special cases for international competitions
    if (cleanCountry === 'World') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
    }

    if (cleanCountry === 'Europe') {
      return 'https://flagsapi.com/EU/flat/24.png';
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

  // Use only the live fixtures data
  const allFixtures = fixtures;

  // Collect all matches from all leagues and add league info
  const allMatches = allFixtures.map((fixture: any) => ({
    ...fixture,
    leagueInfo: {
      name: fixture.league?.name || 'Unknown League',
      country: fixture.league?.country || 'Unknown Country',
      logo: fixture.league?.logo || '/assets/fallback-logo.svg'
    }
  }));

  // Filter for live matches only when both filters are active
  const filteredMatches = liveFilterActive && timeFilterActive 
    ? allMatches.filter((match: any) => {
        const status = match.fixture.status.short;
        return ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status);
      })
    : allMatches;

  // Sort all matches by priority: Live → Upcoming → Finished
  const sortedMatches = filteredMatches.sort((a: any, b: any) => {
    const aStatus = a.fixture.status.short;
    const bStatus = b.fixture.status.short;
    const aDate = parseISO(a.fixture.date);
    const bDate = parseISO(b.fixture.date);

    // Ensure valid dates
    if (!isValid(aDate) || !isValid(bDate)) {
      return 0;
    }

    const aTime = aDate.getTime();
    const bTime = bDate.getTime();

    // Check if matches are live
    const aIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
    const bIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);

    // Live matches first
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // If both live, sort by status priority
    if (aIsLive && bIsLive) {
      const statusOrder: { [key: string]: number } = {
        'LIVE': 1, '1H': 2, '2H': 3, 'HT': 4, 'ET': 5, 'BT': 6, 'P': 7, 'INT': 8
      };
      const aOrder = statusOrder[aStatus] || 99;
      const bOrder = statusOrder[bStatus] || 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }

    // Check if matches are finished
    const aIsFinished = ['FT', 'AET', 'PEN'].includes(aStatus);
    const bIsFinished = ['FT', 'AET', 'PEN'].includes(bStatus);

    // Upcoming matches before finished matches
    if (!aIsFinished && bIsFinished) return -1;
    if (aIsFinished && !bIsFinished) return 1;

    // Within same category, sort by time
    return aTime - bTime;
  });

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
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No live matches available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Main Header */}
      <h3 className="text-base font-bold text-gray-800 mt-4 mb-0 bg-white border border-gray-200 p-3 rounded-lg">
        {liveFilterActive && timeFilterActive ? "Popular Football Live Score" : 
         liveFilterActive && !timeFilterActive ? "Live Football Scores" : 
         !liveFilterActive && timeFilterActive ? "All Matches by Time" : 
         "Live Football Scores"}
      </h3>

      {/* Single consolidated card with all matches sorted by time */}
      <Card className="mt-4 overflow-hidden">
        {/* Header showing total matches */}
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <Activity className="w-6 h-6 text-red-500 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold text-base text-gray-800">
              All Matches - Sorted by Time
            </span>
            <span className="text-xs text-gray-600">
              {sortedMatches.length} matches found
            </span>
          </div>
          <div className="flex gap-1 ml-auto">
            <span className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
        </div>

        {/* All Matches */}
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match: any) => (
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
                      src={match.teams.home.logo || '/assets/fallback-logo.png'}
                      alt={match.teams.home.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/assets/fallback-logo.png') {
                          target.src = '/assets/fallback-logo.png';
                        }
                      }}
                    />
                  </div>

                  {/* Score/Time Center */}
                  <div className="flex flex-col items-center justify-center px-4 flex-shrink-0" style={{ marginTop: '-14px' }}>
                    <div className="text-xs font-semibold mb-0.5">
                      {match.fixture.status.short === 'FT' ? (
                        <span className="text-gray-600">Ended</span>
                      ) : match.fixture.status.short === 'HT' ? (
                        <span className="text-red-600 animate-pulse">HT</span>
                      ) : ['LIVE', '1H', '2H', 'ET', 'BT', 'P', 'INT'].includes(match.fixture.status.short) ? (
                        <span className="text-red-600 animate-pulse">{match.fixture.status.elapsed || 0}'</span>
                      ) : (
                        <span className="text-gray-600">
                          {format(parseISO(match.fixture.date), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold flex items-center gap-2">
                      <span className="text-black">
                        {match.goals?.home ?? 0}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-black">
                        {match.goals?.away ?? 0}
                      </span>
                    </div>
                    {/* League info below score */}
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {match.leagueInfo.name}
                    </div>
                  </div>

                  <div className="flex-shrink-0 mx-1">
                    <img
                      src={match.teams.away.logo || '/assets/fallback-logo.png'}
                      alt={match.teams.away.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/assets/fallback-logo.png') {
                          target.src = '/assets/fallback-logo.png';
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
    </>
  );
};

export default LiveMatchByTime;
