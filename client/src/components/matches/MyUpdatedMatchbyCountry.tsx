
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyImage from "../common/LazyImage";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import { getCountryFlagWithFallbackSync } from "@/lib/flagUtils";

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    "-sc",
    "-SC",
    " SC",
    " FC",
    " CF",
    " United",
    " City",
    " Islands",
    " Republic",
    " National Team",
    " U23",
    " U21",
    " U20",
    " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  // Handle specific country name shortenings
  const countryMappings: { [key: string]: string } = {
    "Cape Verde Islands": "Cape Verde",
    "Central African Republic": "CAR",
    "Dominican Republic": "Dominican Rep",
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago": "Trinidad",
    "Papua New Guinea": "Papua NG",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "Saudi",
    "South Africa": "S. Africa",
    "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rica",
    "Puerto Rico": "Puerto Rico",
  };

  // Check if the team name matches any country mappings
  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  // If still too long (more than 12 characters), intelligently shorten multi-word names
  if (shortened.length > 12) {
    const words = shortened.split(" ");

    if (words.length > 1) {
      // For multi-word names, shorten the last word progressively
      const lastWordIndex = words.length - 1;
      const lastWord = words[lastWordIndex];

      if (lastWord.length > 4) {
        // First try 3 characters
        words[lastWordIndex] = lastWord.substring(0, 3);
        shortened = words.join(" ");

        // If still too long, try 2 characters for the last word
        if (shortened.length > 12) {
          words[lastWordIndex] = lastWord.substring(0, 2);
          shortened = words.join(" ");
        }
      }
    } else {
      // For single long words, truncate to 10 characters
      shortened = shortened.substring(0, 10);
    }
  }

  return shortened.trim();
};

interface MyUpdatedMatchbyCountryProps {
  selectedDate: string;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const MyUpdatedMatchbyCountry: React.FC<MyUpdatedMatchbyCountryProps> = ({
  selectedDate,
  liveFilterActive = false,
  timeFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Fetch fixtures for the selected date
  const { data: fixtures = [], isLoading, error } = useQuery({
    queryKey: ["fixtures-by-date", selectedDate],
    queryFn: async () => {
      console.log(`🔄 [MyUpdatedMatchbyCountry] Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`✅ [MyUpdatedMatchbyCountry] Received ${data?.length || 0} fixtures for ${selectedDate}`);
      return data;
    },
    enabled: !!selectedDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Group fixtures by country with filtering
  const fixturesByCountry = useMemo(() => {
    if (!fixtures || !Array.isArray(fixtures)) return {};

    const grouped: { [country: string]: any[] } = {};

    fixtures.forEach((fixture) => {
      if (!fixture || !fixture.league || !fixture.teams) return;

      // Apply live filter if active
      if (liveFilterActive) {
        const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
          fixture.fixture?.status?.short
        );
        if (!isLive) return;
      }

      // Get country name and normalize it
      let country = fixture.league.country || 'Unknown';
      
      // Handle World competitions
      if (country === 'World') {
        country = 'International';
      }

      if (!grouped[country]) {
        grouped[country] = [];
      }

      grouped[country].push(fixture);
    });

    // Sort countries by number of matches (descending)
    const sortedCountries = Object.keys(grouped).sort((a, b) => {
      return grouped[b].length - grouped[a].length;
    });

    const sortedGrouped: { [country: string]: any[] } = {};
    sortedCountries.forEach(country => {
      // Sort matches within each country by time
      sortedGrouped[country] = grouped[country].sort((a, b) => {
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
      });
    });

    return sortedGrouped;
  }, [fixtures, liveFilterActive]);

  const toggleCountryExpansion = (country: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) {
      newExpanded.delete(country);
    } else {
      newExpanded.add(country);
    }
    setExpandedCountries(newExpanded);
  };

  const formatMatchTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getStatusDisplay = (fixture: any) => {
    const status = fixture.fixture?.status?.short;
    const elapsed = fixture.fixture?.status?.elapsed;

    switch (status) {
      case 'NS':
        return formatMatchTime(fixture.fixture.date);
      case 'LIVE':
      case '1H':
      case '2H':
        return elapsed ? `${elapsed}'` : 'LIVE';
      case 'HT':
        return 'HT';
      case 'FT':
        return 'FT';
      case 'ET':
        return 'ET';
      case 'P':
        return 'PEN';
      default:
        return status || 'TBD';
    }
  };

  if (isLoading) {
    return (
      <div className="country-matches-container">
        <div className="p-4 text-center text-gray-500">
          Loading matches...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="country-matches-container">
        <div className="p-4 text-center text-red-500">
          Error loading matches. Please try again.
        </div>
      </div>
    );
  }

  const countries = Object.keys(fixturesByCountry);

  if (countries.length === 0) {
    return (
      <div className="country-matches-container">
        <div className="p-4 text-center text-gray-500">
          No matches found for {selectedDate}
        </div>
      </div>
    );
  }

  return (
    <div className="country-matches-container todays-matches-by-country-container">
      <div className="space-y-2">
        {countries.map((country) => {
          const countryFixtures = fixturesByCountry[country];
          const isExpanded = expandedCountries.has(country);
          const liveCount = countryFixtures.filter(f => 
            ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(f.fixture?.status?.short)
          ).length;

          return (
            <Card key={country} className="country-card">
              <CardHeader className="pb-2">
                <button
                  onClick={() => toggleCountryExpansion(country)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MyCircularFlag
                      country={country}
                      size={24}
                      className="flex-shrink-0"
                    />
                    <span className="font-semibold text-gray-900">
                      {country}({countryFixtures.length})
                    </span>
                    {liveCount > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        {liveCount} LIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                  </div>
                </button>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {countryFixtures.map((fixture) => (
                      <div
                        key={fixture.fixture.id}
                        onClick={() => onMatchCardClick?.(fixture)}
                        className="match-row flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Home Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <LazyImage
                              src={fixture.teams.home.logo}
                              alt={fixture.teams.home.name}
                              className="w-6 h-6 flex-shrink-0"
                              fallbackSrc="/assets/fallback-logo.png"
                            />
                            <span className="text-sm font-medium truncate">
                              {shortenTeamName(fixture.teams.home.name)}
                            </span>
                          </div>

                          {/* Score/Time */}
                          <div className="flex items-center justify-center min-w-[60px] text-center">
                            <div className="text-sm font-semibold">
                              {fixture.goals?.home !== null && fixture.goals?.away !== null ? (
                                <span className="text-gray-900">
                                  {fixture.goals.home} - {fixture.goals.away}
                                </span>
                              ) : (
                                <span className="text-gray-600">
                                  {getStatusDisplay(fixture)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-sm font-medium truncate">
                              {shortenTeamName(fixture.teams.away.name)}
                            </span>
                            <LazyImage
                              src={fixture.teams.away.logo}
                              alt={fixture.teams.away.name}
                              className="w-6 h-6 flex-shrink-0"
                              fallbackSrc="/assets/fallback-logo.png"
                            />
                          </div>
                        </div>

                        {/* League */}
                        <div className="text-xs text-gray-500 ml-3 truncate max-w-[100px]">
                          {fixture.league.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyUpdatedMatchbyCountry;
