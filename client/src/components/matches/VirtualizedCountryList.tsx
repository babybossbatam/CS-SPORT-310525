
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedCountryListProps {
  countries: string[];
  getCountryData: (country: string) => any;
  expandedCountries: Set<string>;
  expandedLeagues: Set<string>;
  starredMatches: Set<number>;
  hiddenMatches: Set<number>;
  halftimeFlashMatches: Set<number>;
  fulltimeFlashMatches: Set<number>;
  goalFlashMatches: Set<number>;
  onToggleCountry: (country: string) => void;
  onToggleLeague: (country: string, leagueId: number) => void;
  onStarMatch: (matchId: number) => void;
  onMatchClick?: (fixture: any) => void;
  observeCountryElement: (element: HTMLElement | null, country: string) => void;
  CountrySection: React.ComponentType<any>;
}

const ITEM_HEIGHT = 60; // Base height for collapsed country
const EXPANDED_BASE_HEIGHT = 120; // Additional height when expanded

const VirtualizedCountryList: React.FC<VirtualizedCountryListProps> = ({
  countries,
  getCountryData,
  expandedCountries,
  expandedLeagues,
  starredMatches,
  hiddenMatches,
  halftimeFlashMatches,
  fulltimeFlashMatches,
  goalFlashMatches,
  onToggleCountry,
  onToggleLeague,
  onStarMatch,
  onMatchClick,
  observeCountryElement,
  CountrySection
}) => {
  // Calculate dynamic heights based on expanded state
  const getItemSize = useCallback((index: number) => {
    const country = countries[index];
    const countryData = getCountryData(country);
    const isExpanded = expandedCountries.has(country);
    
    if (!isExpanded) return ITEM_HEIGHT;
    
    // Calculate height based on number of leagues and matches
    const leagueCount = Object.keys(countryData?.leagues || {}).length;
    const matchCount = Object.values(countryData?.leagues || {}).reduce(
      (sum: number, league: any) => sum + (league.matches?.length || 0), 0
    );
    
    return ITEM_HEIGHT + EXPANDED_BASE_HEIGHT + (leagueCount * 40) + (matchCount * 30);
  }, [countries, getCountryData, expandedCountries]);

  // Memoized item renderer
  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const country = countries[index];
    const countryData = getCountryData(country);
    const isExpanded = expandedCountries.has(country);

    return (
      <div style={style}>
        <CountrySection
          key={country}
          country={country}
          countryData={countryData}
          isExpanded={isExpanded}
          expandedLeagues={expandedLeagues}
          starredMatches={starredMatches}
          hiddenMatches={hiddenMatches}
          halftimeFlashMatches={halftimeFlashMatches}
          fulltimeFlashMatches={fulltimeFlashMatches}
          goalFlashMatches={goalFlashMatches}
          onToggleCountry={onToggleCountry}
          onToggleLeague={onToggleLeague}
          onStarMatch={onStarMatch}
          onMatchClick={onMatchClick}
          observeCountryElement={observeCountryElement}
        />
      </div>
    );
  }, [
    countries,
    getCountryData,
    expandedCountries,
    expandedLeagues,
    starredMatches,
    hiddenMatches,
    halftimeFlashMatches,
    fulltimeFlashMatches,
    goalFlashMatches,
    onToggleCountry,
    onToggleLeague,
    onStarMatch,
    onMatchClick,
    observeCountryElement,
    CountrySection
  ]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return Math.min(600, countries.length * 100); // Cap at 600px height
  }, [countries.length]);

  if (countries.length === 0) return null;

  return (
    <List
      height={totalHeight}
      itemCount={countries.length}
      itemSize={getItemSize}
      itemData={countries}
      overscanCount={5} // Render 5 extra items outside viewport
    >
      {ItemRenderer}
    </List>
  );
};

export default VirtualizedCountryList;
