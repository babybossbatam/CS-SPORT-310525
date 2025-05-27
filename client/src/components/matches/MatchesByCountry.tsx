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

    // Special handling for World/International competitions
    if (cleanCountry === 'World' || cleanCountry === 'International' || cleanCountry === 'Unknown') {
      return '/assets/fallback-logo.png'; // Default football logo
    }

    // Country code mapping for better flag display
    const countryCodeMap: { [key: string]: string } = {
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
      'Faroe Islands': 'FO'
    };

    // Safe substring operation with proper null checks
    let countryCode = 'XX';
    try {
      if (countryCodeMap[cleanCountry]) {
        countryCode = countryCodeMap[cleanCountry];
      } else if (cleanCountry && typeof cleanCountry === 'string' && cleanCountry.length >= 2) {
        countryCode = cleanCountry.substring(0, 2).toUpperCase();
      }
    } catch (error) {
      console.error('Error processing country name:', cleanCountry, error);
      countryCode = 'XX';
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

    const country = league.country || 'Unknown';
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