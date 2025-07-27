
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
import "../../styles/flasheffect.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import NoLiveMatchesEmpty from "./NoLiveMatchesEmpty";

interface LiveBasketByTimeProps {
  liveFilterActive: boolean;
  timeFilterActive: boolean;
  liveFixtures: any[];
  setLiveFilterActive: (active: boolean) => void;
  onMatchCardClick?: (fixture: any) => void;
}

export const LiveBasketByTime: React.FC<LiveBasketByTimeProps> = ({
  liveFilterActive,
  timeFilterActive,
  liveFixtures,
  setLiveFilterActive,
  onMatchCardClick
}) => {
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Set<string>>(
    new Set()
  );
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());

  // Group live matches by time slots
  const groupedMatches = useMemo(() => {
    if (!liveFixtures || liveFixtures.length === 0) return {};

    const groups: { [key: string]: any[] } = {};

    liveFixtures.forEach((match) => {
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

    // Sort matches within each time slot
    Object.keys(groups).forEach(timeSlot => {
      groups[timeSlot].sort((a, b) => {
        const aIsLive = a.fixture?.status?.short === "1H" || a.fixture?.status?.short === "2H" || a.fixture?.status?.short === "HT";
        const bIsLive = b.fixture?.status?.short === "1H" || b.fixture?.status?.short === "2H" || b.fixture?.status?.short === "HT";
        
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        return 0;
      });
    });

    return groups;
  }, [liveFixtures]);

  // Sort time slots
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

  // Auto-expand all time slots initially
  useEffect(() => {
    if (sortedTimeSlots.length > 0) {
      setExpandedTimeSlots(new Set(sortedTimeSlots));
    }
  }, [sortedTimeSlots.join(',')]);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🔴 [LiveBasketByTime] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'LiveBasketByTime'
    });
    onMatchCardClick?.(fixture);
  };

  if (!liveFixtures || liveFixtures.length === 0) {
    return <NoLiveMatchesEmpty />;
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

export default LiveBasketByTime;
