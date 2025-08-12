
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import LazyImage from '../common/LazyImage';
import MyCircularFlag from '../common/MyCircularFlag';
import { isNationalTeam } from '@/lib/teamLogoSources';

interface VirtualizedCountryListProps {
  countries: any[];
  expandedCountries: Set<string>;
  toggleCountry: (country: string) => void;
  onMatchCardClick?: (match: any) => void;
}

const VirtualizedCountryList: React.FC<VirtualizedCountryListProps> = ({
  countries,
  expandedCountries,
  toggleCountry,
  onMatchCardClick
}) => {
  // Calculate dynamic height based on content
  const getItemHeight = useCallback((index: number) => {
    const country = countries[index];
    if (!country) return 60;

    const isExpanded = expandedCountries.has(country.country);
    if (!isExpanded) return 60; // Collapsed height

    // Calculate expanded height based on number of matches
    let totalMatches = 0;
    Object.values(country.leagues || {}).forEach((leagueData: any) => {
      totalMatches += leagueData.matches?.length || 0;
    });

    // Base height + match cards height + league headers
    return 60 + (totalMatches * 80) + (Object.keys(country.leagues || {}).length * 40);
  }, [countries, expandedCountries]);

  // Use a fixed height for simplicity to avoid the function issue
  const ITEM_HEIGHT = 200; // Fixed height per item

  const CountryItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const country = countries[index];
    if (!country) return null;

    const isExpanded = expandedCountries.has(country.country);
    const totalMatches = Object.values(country.leagues || {}).reduce(
      (sum: number, leagueData: any) => sum + (leagueData.matches?.length || 0), 
      0
    );

    return (
      <div style={style}>
        <Card className="mb-4">
          {/* Country Header */}
          <CardHeader 
            className="flex flex-row items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => {
              if (typeof toggleCountry === 'function') {
                toggleCountry(country.country);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <LazyImage
                src={country.flag || '/assets/fallback-logo.svg'}
                alt={`${country.country} flag`}
                className="w-6 h-4 object-cover rounded-sm"
                fallbackSrc="/assets/fallback-logo.svg"
              />
              <div>
                <h3 className="font-semibold text-gray-800">{country.country}</h3>
                <p className="text-sm text-gray-500">{totalMatches} matches</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </CardHeader>

          {/* Expanded Content */}
          {isExpanded && (
            <CardContent className="p-0">
              {Object.values(country.leagues || {}).map((leagueData: any) => (
                <div key={leagueData.league.id} className="border-t border-gray-100">
                  {/* League Header */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50">
                    <LazyImage
                      src={leagueData.league.logo || '/assets/fallback-logo.svg'}
                      alt={leagueData.league.name}
                      className="w-5 h-5 object-contain"
                      fallbackSrc="/assets/fallback-logo.svg"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {leagueData.league.name}
                    </span>
                  </div>

                  {/* Matches */}
                  <div className="space-y-0">
                    {leagueData.matches?.map((match: any) => (
                      <div
                        key={match.fixture.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => onMatchCardClick?.(match)}
                      >
                        {/* Home Team */}
                        <div className="flex items-center gap-2 flex-1">
                          {isNationalTeam(match.teams.home, leagueData.league) ? (
                            <MyCircularFlag
                              teamName={match.teams.home.name}
                              fallbackUrl={`/api/team-logo/square/${match.teams.home.id}?size=24`}
                              alt={match.teams.home.name}
                              size="24px"
                            />
                          ) : (
                            <LazyImage
                              src={`/api/team-logo/square/${match.teams.home.id}?size=24`}
                              alt={match.teams.home.name}
                              className="w-6 h-6 object-contain"
                              fallbackSrc="/assets/fallback-logo.svg"
                            />
                          )}
                          <span className="text-sm text-gray-800 truncate">
                            {match.teams.home.name}
                          </span>
                        </div>

                        {/* Score/Time */}
                        <div className="text-center px-2">
                          {match.fixture.status.short === 'NS' ? (
                            <span className="text-xs text-gray-500">
                              {new Date(match.fixture.date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          ) : match.goals.home !== null && match.goals.away !== null ? (
                            <span className="text-sm font-medium">
                              {match.goals.home} - {match.goals.away}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {match.fixture.status.short}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm text-gray-800 truncate text-right">
                            {match.teams.away.name}
                          </span>
                          {isNationalTeam(match.teams.away, leagueData.league) ? (
                            <MyCircularFlag
                              teamName={match.teams.away.name}
                              fallbackUrl={`/api/team-logo/square/${match.teams.away.id}?size=24`}
                              alt={match.teams.away.name}
                              size="24px"
                            />
                          ) : (
                            <LazyImage
                              src={`/api/team-logo/square/${match.teams.away.id}?size=24`}
                              alt={match.teams.away.name}
                              className="w-6 h-6 object-contain"
                              fallbackSrc="/assets/fallback-logo.svg"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    );
  }, [countries, expandedCountries, toggleCountry, onMatchCardClick]);

  if (!countries.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No countries to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px]">
      <List
        height={600}
        itemCount={countries.length}
        itemSize={ITEM_HEIGHT}
        width="100%"
      >
        {CountryItem}
      </List>
    </div>
  );
};

export default VirtualizedCountryList;
