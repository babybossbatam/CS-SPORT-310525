import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import MyHomeFeaturedMatchNew from "@/components/matches/MyHomeFeaturedMatchNew";
import HomeTopScorersList from "@/components/leagues/HomeTopScorersList";
import LeagueStandingsFilter from "@/components/leagues/LeagueStandingsFilter";
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import MyAllLeague from "@/components/matches/MyAllLeague";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import PopularTeamsList from "@/components/teams/PopularTeamsList";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MyInfo from "@/components/info/MyInfo";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const { isMobile } = useDeviceInfo();

  // Fetch fixtures for the selected date to pass to MyAllLeague
  const { data: fixtures = [], isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures-for-all-leagues', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      console.log(`🔄 [MyRightContent] Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`✅ [MyRightContent] Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    enabled: !!selectedDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto space-y-4 pb-4">
      {/* Featured Match Section - Hidden on mobile */}
      {!isMobile && (
        <MyHomeFeaturedMatchNew selectedDate={selectedDate} maxMatches={8} />
      )}

      <HomeTopScorersList />

      <LeagueStandingsFilter />

      {/* CS SPORT Information Card */}
      <MyInfo />

      {/* Popular Leagues and All League List sections */}
      <div className="grid grid-cols-2 gap-4 ">
        <div className="space-y-4">
          <PopularLeaguesList />
          <PopularTeamsList />
        </div>
        <MyAllLeague selectedDate={selectedDate} fixtures={fixtures} />
      </div>
    </div>
  );
};

export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };
