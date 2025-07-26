
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Filter, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import "../../styles/flasheffect.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import NoLiveMatchesEmpty from "./NoLiveMatchesEmpty";

interface LiveBasketForAllCountryProps {
  liveFilterActive: boolean;
  timeFilterActive: boolean;
  liveFixtures: any[];
  setLiveFilterActive: (active: boolean) => void;
  onMatchCardClick?: (fixture: any) => void;
}

export const LiveBasketForAllCountry: React.FC<LiveBasketForAllCountryProps> = ({
  liveFilterActive,
  timeFilterActive,
  liveFixtures,
  setLiveFilterActive,
  onMatchCardClick
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set()
  );
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());

  // Group live matches by country
  const groupedMatches = useMemo(() => {
    if (!liveFixtures || liveFixtures.length === 0) return {};

    const groups: { [key: string]: any[] } = {};

    liveFixtures.forEach((match) => {
      const country = match.league?.country || "Unknown";
      
      if (!groups[country]) {
        groups[country] = [];
      }
      groups[country].push(match);
    });

    // Sort matches within each country by status (live first)
    Object.keys(groups).forEach(country => {
      groups[country].sort((a, b) => {
        const aIsLive = a.fixture?.status?.short === "1H" || a.fixture?.status?.short === "2H" || a.fixture?.status?.short === "HT";
        const bIsLive = b.fixture?.status?.short === "1H" || b.fixture?.status?.short === "2H" || b.fixture?.status?.short === "HT";
        
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return 0;
      });
    });

    return groups;
  }, [liveFixtures]);

  // Sort countries alphabetically
  const sortedCountries = Object.keys(groupedMatches).sort();

  const toggleCountry = (country: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) {
      newExpanded.delete(country);
    } else {
      newExpanded.add(country);
    }
    setExpandedCountries(newExpanded);
  };

  // Auto-expand countries with live matches
  useEffect(() => {
    const countriesWithLiveMatches = sortedCountries.filter(country => 
      groupedMatches[country].some(match => 
        match.fixture?.status?.short === "1H" || 
        match.fixture?.status?.short === "2H" || 
        match.fixture?.status?.short === "HT"
      )
    );
    setExpandedCountries(new Set(countriesWithLiveMatches));
  }, [sortedCountries.join(',')]);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🔴 [LiveBasketForAllCountry] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'LiveBasketForAllCountry'
    });
    onMatchCardClick?.(fixture);
  };

  if (!liveFixtures || liveFixtures.length === 0) {
    return <NoLiveMatchesEmpty />;
  }

  return (
    <div className="space-y-4">
      {sortedCountries.map((country) => {
        const matches = groupedMatches[country];
        const isExpanded = expandedCountries.has(country);
        const liveMatchCount = matches.filter(match => 
          match.fixture?.status?.short === "1H" || 
          match.fixture?.status?.short === "2H" || 
          match.fixture?.status?.short === "HT"
        ).length;

        return (
          <Card key={country} className="shadow-md">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 py-3"
              onClick={() => toggleCountry(country)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MyCircularFlag 
                    countryName={country}
                    size={20}
                    className="flex-shrink-0"
                  />
                  <span className="font-semibold text-sm">{country}</span>
                  {liveMatchCount > 0 && (
                    <div className="flex items-center gap-1">
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
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{matches.length} matches</span>
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
                  {matches.map((match) => (
                    <div
                      key={match.fixture.id}
                      className={`match-card-container group ${
                        halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
                      } ${
                        fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
                      }`}
                      data-fixture-id={match.fixture.id}
                      onClick={() => handleMatchCardClick(match)}
                    >
                      <LazyMatchItem
                        match={match}
                        showLeagueName={true}
                        showCountryFlag={false} // Already shown in header
                        isLive={
                          match.fixture?.status?.short === "1H" ||
                          match.fixture?.status?.short === "2H" ||
                          match.fixture?.status?.short === "HT"
                        }
                        onMatchClick={() => handleMatchCardClick(match)}
                      />
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

export default LiveBasketForAllCountry;
