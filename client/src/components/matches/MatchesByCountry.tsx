import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import TeamLogo from './TeamLogo';
import { 
  formatTimeInUserTimezone, 
  convertToUserTimezone, 
  getUserTimezone,
  getValidDate,
  isToday,
  isTomorrow,
  isYesterday
} from '@/lib/dateUtils';

interface MatchesByCountryProps {
  selectedDate: string;
}

const MatchesByCountry: React.FC<MatchesByCountryProps> = ({ selectedDate }) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());



  const { data: fixtures = [] } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      return await response.json();
    }
  });

  // Auto-expand countries that have finished matches today
  useEffect(() => {
    if (fixtures.length > 0) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const isToday = selectedDate === today;

      if (isToday) {
        // For today, auto-expand countries that have finished matches
        const countriesWithFinishedMatches = new Set<string>();

        fixtures.forEach((fixture: any) => {
          const status = fixture.fixture.status.short;
          if (['FT', 'AET', 'PEN'].includes(status)) {
            countriesWithFinishedMatches.add(fixture.league.country);
          }
        });

        setExpandedCountries(countriesWithFinishedMatches);
      } else {
        // For other dates, keep collapsed
        setExpandedCountries(new Set());
      }
    }
  }, [fixtures, selectedDate]);

  // Enhanced country flag mapping with comprehensive null safety
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
      'England': 'GB-ENG', 'Scotland': 'GB-SCT', 'Wales': 'GB-WLS', 'Northern Ireland': 'GB-NIR',
      'United States': 'US', 'South Korea': 'KR', 'Czech Republic': 'CZ', 'United Arab Emirates': 'AE',
      'Bosnia & Herzegovina': 'BA', 'North Macedonia': 'MK', 'Trinidad & Tobago': 'TT', 'Ivory Coast': 'CI',
      'Cape Verde': 'CV', 'Democratic Republic of Congo': 'CD', 'Curacao': 'CW', 'Faroe Islands': 'FO',
      'Saudi Arabia': 'SA', 'South Africa': 'ZA', 'Costa Rica': 'CR', 'El Salvador': 'SV', 'Puerto Rico': 'PR',
      'New Zealand': 'NZ', 'Dominican Republic': 'DO', 'Brazil': 'BR', 'Argentina': 'AR', 'Germany': 'DE',
      'France': 'FR', 'Italy': 'IT', 'Spain': 'ES', 'Portugal': 'PT', 'Netherlands': 'NL', 'Belgium': 'BE',
      'Switzerland': 'CH', 'Austria': 'AT', 'Poland': 'PL', 'Turkey': 'TR', 'Russia': 'RU', 'Ukraine': 'UA',
      'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Greece': 'GR', 'Croatia': 'HR',
      'Serbia': 'RS', 'Romania': 'RO', 'Bulgaria': 'BG', 'Hungary': 'HU', 'Slovenia': 'SI', 'Slovakia': 'SK',
      'Ireland': 'IE', 'Iceland': 'IS', 'Japan': 'JP', 'China': 'CN', 'India': 'IN', 'Australia': 'AU',
      'Canada': 'CA', 'Mexico': 'MX', 'Colombia': 'CO', 'Peru': 'PE', 'Chile': 'CL', 'Uruguay': 'UY',
      'Nigeria': 'NG', 'Ghana': 'GH', 'Senegal': 'SN', 'Morocco': 'MA', 'Tunisia': 'TN', 'Algeria': 'DZ',
      'Egypt': 'EG', 'Cameroon': 'CM', 'Israel': 'IL', 'Jordan': 'JO', 'Iran': 'IR', 'Thailand': 'TH',
      'Vietnam': 'VN', 'Malaysia': 'MY', 'Singapore': 'SG', 'Indonesia': 'ID', 'Philippines': 'PH'
    };

    // Use country mapping, fallback to 'XX' for unknown countries
    let countryCode = 'XX';
    if (countryCodeMap[cleanCountry]) {
      countryCode = countryCodeMap[cleanCountry];
    } else {
      console.warn('Unknown country for flag mapping:', cleanCountry);
      countryCode = 'XX'; // Will show a default flag
    }

    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  };

  // Group fixtures by country with comprehensive validation
  const fixturesByCountry = fixtures.reduce((acc: any, fixture: any) => {
    // Validate fixture structure
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      console.warn('Invalid fixture data structure:', fixture);
      return acc;
    }

    // Validate league data
    const league = fixture.league;
    if (!league.id || !league.name) {
      console.warn('Invalid league data:', league);
      return acc;
    }

    // Validate team data
    if (!fixture.teams.home || !fixture.teams.away || 
        !fixture.teams.home.name || !fixture.teams.away.name) {
      console.warn('Invalid team data:', fixture.teams);
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
      console.warn('Skipping fixture with invalid/unknown country:', country, fixture);
      return acc;
    }

    // Only allow valid country names, World, and Europe
    const validCountry = country.trim();
    if (validCountry !== 'World' && validCountry !== 'Europe' && validCountry.length === 0) {
      console.warn('Skipping fixture with empty country name:', country, fixture);
      return acc;
    }

    // Filter out esports leagues which have null country but keep real international competitions
    const leagueName = league.name?.toLowerCase() || '';
    if (leagueName.includes('esoccer') || leagueName.includes('ebet') || leagueName.includes('cyber')) {
      console.warn('Skipping esports fixture:', leagueName, fixture);
      return acc;
    }

    const leagueId = league.id;

    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, league.flag),
        leagues: {}
      };
    }

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: {
          ...league,
          logo: league.logo || 'https://media.api-sports.io/football/leagues/1.png'
        },
        matches: []
      };
    }

    // Add fixture with validated data
    acc[country].leagues[leagueId].matches.push({
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

    return acc;
  }, {});

  // Sort countries alphabetically
  const sortedCountries = Object.values(fixturesByCountry).sort((a: any, b: any) => {
    const countryA = a?.country || '';
    const countryB = b?.country || '';
    return countryA.localeCompare(countryB);
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

  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;

    // Explicitly check for ended match statuses
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      return status; // Return the actual status code (FT, AET, etc.)
    } 
    // Check for live match statuses
    else if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'HT' : 'LIVE';
    } 
    // For upcoming matches, just show "Scheduled"
    else {
      const matchDate = new Date(fixture.fixture.date);
      const now = new Date();

      // If match time has passed but status is still 'NS', it might be delayed
      if (matchDate < now && status === 'NS') {
        return 'Delayed';
      }

      return 'Scheduled';
    }
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const matchDate = new Date(fixture.fixture.date);
    const now = new Date();

    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      return 'bg-gray-100 text-gray-700 font-semibold';
    } else if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 'bg-green-100 text-green-700 font-semibold';
    } else if (matchDate < now && status === 'NS') {
      // Delayed match styling
      return 'bg-orange-100 text-orange-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  if (!fixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
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

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0">
          {sortedCountries.map((countryData: any) => {
            const isExpanded = expandedCountries.has(countryData.country);
            const totalMatches = Object.values(countryData.leagues).reduce(
              (sum: number, league: any) => sum + league.matches.length, 0
            );

            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchesByCountry;