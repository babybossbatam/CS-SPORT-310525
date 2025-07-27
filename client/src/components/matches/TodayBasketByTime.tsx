
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Clock, MapPin, Users, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";

interface TodayBasketByTimeProps {
  selectedDate: string;
  timeFilterActive: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

export const TodayBasketByTime: React.FC<TodayBasketByTimeProps> = ({
  selectedDate,
  timeFilterActive,
  liveFilterActive,
  onMatchCardClick
}) => {
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Set<string>>(
    new Set()
  );

  // Fetch fixtures for the selected date
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures-by-date", selectedDate],
    queryFn: async () => {
      console.log(`🔄 [TodayBasketByTime] Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}`);
      const data = await response.json();
      console.log(`✅ [TodayBasketByTime] Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Group matches by time slots
  const groupedMatches = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return {};

    const groups: { [key: string]: any[] } = {};

    fixtures.forEach((match) => {
      if (!match?.fixture?.date) return;

      try {
        const matchDate = new Date(match.fixture.date);
        const timeSlot = matchDate.toISOString().substring(11, 16); // HH:MM format
        
        if (!groups[timeSlot]) {
          groups[timeSlot] = [];
        }
        groups[timeSlot].push(match);
      } catch (error) {
        console.error("Error processing match date:", error);
      }
    });

    // Sort matches within each time slot by league/status
    Object.keys(groups).forEach(timeSlot => {
      groups[timeSlot].sort((a, b) => {
        // Sort by league name first
        const leagueCompare = (a.league?.name || '').localeCompare(b.league?.name || '');
        if (leagueCompare !== 0) return leagueCompare;
        
        // Then by match status (live matches first)
        const aIsLive = a.fixture?.status?.short === "1H" || a.fixture?.status?.short === "2H" || a.fixture?.status?.short === "HT";
        const bIsLive = b.fixture?.status?.short === "1H" || b.fixture?.status?.short === "2H" || b.fixture?.status?.short === "HT";
        
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return 0;
      });
    });

    return groups;
  }, [fixtures]);

  // Sort time slots chronologically
  const sortedTimeSlots = Object.keys(groupedMatches).sort();

  const toggleTimeSlot = (timeSlot: string) => {
    const newExpanded = new Set(expandedTimeSlots);
    if (newExpanded.has(timeSlot)) {
      newExpanded.delete(timeSlot);
    } else {
      newExpanded.add(timeSlot);
    }
    setExpandedTimeSlots(newExpanded);
  };

  // Auto-expand time slots with matches soon or currently live
  useEffect(() => {
    const now = new Date();
    const currentTime = now.toISOString().substring(11, 16);
    const slotsToExpand = new Set<string>();

    sortedTimeSlots.forEach(timeSlot => {
      // Expand current time slot and next few hours
      if (timeSlot >= currentTime && timeSlot <= String(now.getHours() + 2).padStart(2, '0') + ':59') {
        slotsToExpand.add(timeSlot);
      }
      
      // Expand slots with live matches
      const hasLiveMatches = groupedMatches[timeSlot].some(match => 
        match.fixture?.status?.short === "1H" || 
        match.fixture?.status?.short === "2H" || 
        match.fixture?.status?.short === "HT"
      );
      if (hasLiveMatches) {
        slotsToExpand.add(timeSlot);
      }
    });

    setExpandedTimeSlots(slotsToExpand);
  }, [sortedTimeSlots.join(','), selectedDate]);

  const handleMatchCardClick = (fixture: any) => {
    console.log('⏰ [TodayBasketByTime] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'TodayBasketByTime'
    });
    onMatchCardClick?.(fixture);
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading matches...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedTimeSlots.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No matches scheduled</h3>
            <p className="text-sm">There are no matches scheduled for this date.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTimeSlots.map((timeSlot) => {
        const matches = groupedMatches[timeSlot];
        const isExpanded = expandedTimeSlots.has(timeSlot);
        const liveMatchCount = matches.filter(match => 
          match.fixture?.status?.short === "1H" || 
          match.fixture?.status?.short === "2H" || 
          match.fixture?.status?.short === "HT"
        ).length;

        return (
          <Card key={timeSlot} className="shadow-md">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 py-3"
              onClick={() => toggleTimeSlot(timeSlot)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">{timeSlot}</span>
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
                      className="match-card-container group"
                      onClick={() => handleMatchCardClick(match)}
                    >
                      <LazyMatchItem
                        match={match}
                        showLeagueName={true}
                        showCountryFlag={true}
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

export default TodayBasketByTime;
