
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { ChevronDown, ChevronUp, MapPin, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "../../lib/MyPopularLeagueExclusion";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";

interface MyBasketByCountryProps {
  selectedDate: string;
  liveFilterActive: boolean;
  timeFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

export const MyBasketByCountry: React.FC<MyBasketByCountryProps> = ({
  selectedDate,
  liveFilterActive,
  timeFilterActive,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Fetch fixtures for the selected date
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures-by-date", selectedDate],
    queryFn: async () => {
      console.log(`🔄 [MyBasketByCountry] Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}`);
      const data = await response.json();
      console.log(`✅ [MyBasketByCountry] Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Group fixtures by country with filtering
  const groupedByCountry = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return {};

    const groups: { [key: string]: any[] } = {};

    fixtures.forEach((fixture) => {
      // Apply exclusion filters
      const shouldExclude = shouldExcludeFromPopularLeagues(
        fixture.league?.name || "",
        fixture.league?.country || ""
      );

      const isRestricted = isRestrictedUSLeague(
        fixture.league?.name || "",
        fixture.league?.country || ""
      );

      if (shouldExclude || isRestricted) {
        return; // Skip this fixture
      }

      const country = fixture.league?.country || "Unknown";
      
      if (!groups[country]) {
        groups[country] = [];
      }
      groups[country].push(fixture);
    });

    // Sort fixtures within each country by time and status
    Object.keys(groups).forEach(country => {
      groups[country].sort((a, b) => {
        // Sort by live status first (live matches first)
        const aIsLive = a.fixture?.status?.short === "1H" || a.fixture?.status?.short === "2H" || a.fixture?.status?.short === "HT";
        const bIsLive = b.fixture?.status?.short === "1H" || b.fixture?.status?.short === "2H" || b.fixture?.status?.short === "HT";
        
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;

        // Then sort by match time
        if (a.fixture?.date && b.fixture?.date) {
          return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
        }

        return 0;
      });
    });

    return groups;
  }, [fixtures]);

  // Priority countries (will be shown first)
  const priorityCountries = [
    "England", "Spain", "Italy", "Germany", "France", "Netherlands", 
    "Portugal", "Argentina", "Brazil", "Mexico", "USA", "World"
  ];

  // Sort countries with priority countries first
  const sortedCountries = useMemo(() => {
    const countries = Object.keys(groupedByCountry);
    
    const priority = countries
      .filter(country => priorityCountries.includes(country))
      .sort((a, b) => priorityCountries.indexOf(a) - priorityCountries.indexOf(b));
    
    const others = countries
      .filter(country => !priorityCountries.includes(country))
      .sort();

    return [...priority, ...others];
  }, [groupedByCountry]);

  const toggleCountry = (country: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) {
      newExpanded.delete(country);
    } else {
      newExpanded.add(country);
    }
    setExpandedCountries(newExpanded);
  };

  // Auto-expand countries with live matches or priority countries with few matches
  useEffect(() => {
    const countriesToExpand = new Set<string>();

    sortedCountries.forEach(country => {
      const countryMatches = groupedByCountry[country] || [];
      
      const hasLiveMatches = countryMatches.some(fixture =>
        fixture.fixture?.status?.short === "1H" ||
        fixture.fixture?.status?.short === "2H" ||
        fixture.fixture?.status?.short === "HT"
      );

      // Expand if has live matches
      if (hasLiveMatches) {
        countriesToExpand.add(country);
      }
      
      // Expand priority countries with few matches (likely important)
      if (priorityCountries.includes(country) && countryMatches.length <= 5) {
        countriesToExpand.add(country);
      }
    });

    setExpandedCountries(countriesToExpand);
  }, [sortedCountries, groupedByCountry]);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🌍 [MyBasketByCountry] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'MyBasketByCountry'
    });
    onMatchCardClick?.(fixture);
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading matches by country...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedCountries.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No matches found</h3>
            <p className="text-sm">No matches available for the selected date.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedCountries.map((country) => {
        const countryMatches = groupedByCountry[country] || [];
        const isExpanded = expandedCountries.has(country);
        const liveMatchCount = countryMatches.filter(fixture =>
          fixture.fixture?.status?.short === "1H" ||
          fixture.fixture?.status?.short === "2H" ||
          fixture.fixture?.status?.short === "HT"
        ).length;

        return (
          <Card key={country} className="shadow-md">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 py-3"
              onClick={() => toggleCountry(country)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MyCircularFlag
                    countryName={country}
                    size={24}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {country}
                    </span>
                    {liveMatchCount > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </div>
                        <span className="text-xs text-red-600 font-medium">
                          {liveMatchCount} LIVE
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{countryMatches.length} matches</span>
                  <div className={`transform transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </div>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {countryMatches.map((fixture) => (
                    <div
                      key={fixture.fixture.id}
                      className="country-matches-container"
                    >
                      <div
                        className="match-card-container group"
                        onClick={() => handleMatchCardClick(fixture)}
                      >
                        <LazyMatchItem
                          match={fixture}
                          showLeagueName={true}
                          showCountryFlag={false} // Already shown in header
                          isLive={
                            fixture.fixture?.status?.short === "1H" ||
                            fixture.fixture?.status?.short === "2H" ||
                            fixture.fixture?.status?.short === "HT"
                          }
                          onMatchClick={() => handleMatchCardClick(fixture)}
                        />
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
  );
};

export default MyBasketByCountry;
